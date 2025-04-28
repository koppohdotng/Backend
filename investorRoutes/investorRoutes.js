const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library'); 

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin SDK wisssth your service account key

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");

router.get('/fundingrequest/:fundingRequestId', async (req, res) => {
  const fundingRequestId = req.params.fundingRequestId;

  try {
    // Get all funding requests
    const fundingRequestsRef = admin.database().ref('fundingRequest');
    const fundingRequestsSnapshot = await fundingRequestsRef.once('value');
    const fundingRequests = fundingRequestsSnapshot.val();

    if (!fundingRequests) {
      return res.status(404).json({ error: 'Funding requests not found' });
    }

    // Find the funding request with the given ID
    let foundFundingRequest = null;
    let foundUserId = null;

    for (const userId in fundingRequests) {
      const userFundingRequests = fundingRequests[userId];

      for (const requestId in userFundingRequests) {
        if (requestId === fundingRequestId) {
          foundFundingRequest = userFundingRequests[requestId];
          foundUserId = userId;
          break;
        }
      }

      if (foundFundingRequest) {
        break;
      }
    }

    if (!foundFundingRequest) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    res.status(200).json({
      fundingRequestId,
      userId: foundUserId,
      ...foundFundingRequest,
    });
  } catch (error) {
    console.error('Error fetching funding request:', error);
    res.status(500).json({ error: 'Failed to retrieve funding request' });
  }
});

router.get('/investor/:investorId/fundingrequests', async (req, res) => {
  const investorId = req.params.investorId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  try {
    // Get the investor's deal criteria
    const investorRef = admin.database().ref(`investors/${investorId}/dealCriteria`);
    const investorSnapshot = await investorRef.once('value');
    const dealCriteria = investorSnapshot.val();
    console.log(dealCriteria)

    if (!dealCriteria) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    // Get all funding requests
    const fundingRequestsRef = admin.database().ref('fundingRequest');
    const fundingRequestsSnapshot = await fundingRequestsRef.once('value');
    const fundingRequests = fundingRequestsSnapshot.val();
    console.log(fundingRequestsSnapshot)

    if (!fundingRequests) {
      return res.status(200).json({ fundingRequestInfos: [] });
    }

    // Get all user details
    const usersRef = admin.database().ref('users');
    const userPromises = Object.keys(fundingRequests).map(userId => getUserDetails(userId)
      .then(userData => ({ userId, userData, fundingRequest: fundingRequests[userId] }))
      .catch(error => {
        console.error('Error fetching user data:', error);
        return null; // Return null for failed user data fetch
      })
    );

    const userDetailsArray = await Promise.all(userPromises);

    // Filter and map funding requests based on deal criteria
    const filteredFundingRequestInfos = userDetailsArray
      .filter(item => item && item.userData && item.userData.country && item.userData.genderComposition && item.userData.businessSector)
      .map(item => {
        const fundingRequest = item.fundingRequest;
        const fundingRequestId = Object.keys(fundingRequest)[0]; // Assuming fundingRequest is an object with one key
        const requestDetails = fundingRequest[fundingRequestId]; // Get the actual funding request details
        let matchScore = 0;
        let totalCriteria = 0;

        const checkMatch = (criteria, requestValue) => {
          if (criteria) {
            totalCriteria++;
            if (Array.isArray(criteria)) {
              if (criteria.includes(requestValue)) {
                matchScore++;
              }
            } else if (criteria === requestValue) {
              matchScore++;
            }
          }
        };

        // Calculate match score based on deal criteria
        checkMatch(dealCriteria.businessstage, requestDetails.businessstage);
        checkMatch(dealCriteria.investmentstage, requestDetails.investmentStage);
        checkMatch(dealCriteria.businessmodel, requestDetails.businessModel);
        checkMatch(dealCriteria.gendercomposition, item.userData.genderComposition);
        checkMatch(dealCriteria.country, item.userData.country);

        const matchPercentage = (matchScore / totalCriteria) * 100;

        return {
          fundingRequestId,
          userId: item.userId,
          ...requestDetails,
          userCountry: item.userData.country,
          userGenderComposition: item.userData.genderComposition,
          userBusinessSector: item.userData.businessSector,

          matchPercentage,
        };
      });

    // Sort by match percentage
    filteredFundingRequestInfos.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const paginatedResults = filteredFundingRequestInfos.slice(startIndex, endIndex);

    res.status(200).json({
      fundingRequestInfos: paginatedResults,
      currentPage: page,
      totalPages: Math.ceil(filteredFundingRequestInfos.length / pageSize),
    });
  } catch (error) {
    console.error('Error fetching funding requests:', error);
    res.status(500).json({ error: 'Failed to retrieve funding requests' });
  }
});

// This function retrieves user data for a given user ID
async function getUserDetails(userId) {
  const userSnapshot = await admin.database().ref(`users/${userId}`).once('value');
  return userSnapshot.val();
}
//dvdfdsfd


router.post('/saveInvestorInterest/:fundingRequestId/:investorId/userId', (req, res) => {
  const dataRef = db.ref('users');
  const dataRefi = db.ref('investors');
  const fundingRequestId = req.params.fundingRequestId;
  const investorId = req.params.investorId;
  const userId = req.params.userId;

  dataRefi.child(`${investorId}/interest`)
  .push({
    date: Date.now(),
    fundingRequestId: fundingRequestId,
    interestStatus: pending,
  })

  // Update the equity request data with investor interest
  dataRef.child(`${userId}/fundingRequest/${fundingRequestId}/interestedInvestors/${investorId}`)
    .set({
      date: Date.now(),
      investorId,
      interestStatus: true,
    })
    .then(() => {
      res.status(200).json({ message: 'Investor interest saved successfully.' });
    })
    .catch((error) => {
      console.error('Error saving investor interest:', error);
      res.status(500).json({ error: 'Failed to save investor interest.' });
    });
})

router.get('/getFundingRequests', (req, res) => {
  const { fundingRequestIds, page = 1 } = req.query;
  const ids = JSON.parse(fundingRequestIds);
  const perPage = 6;

  // Pagination calculations
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedIds = ids.slice(startIndex, endIndex);

  const dataRef = db.ref('users');
  const promises = paginatedIds.map(id => {
    return new Promise((resolve, reject) => {
      dataRef.orderByChild(`fundingRequest/${id}`).once('value', snapshot => {
        if (snapshot.exists()) {
          snapshot.forEach(childSnapshot => {
            const userId = childSnapshot.key;
            const request = childSnapshot.val().fundingRequest[id];
            if (request) {
              request.fundingRequestId = id;
              request.userId = userId;
              resolve(request);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      }).catch(reject);
    });
  });

  Promise.all(promises)
    .then(results => {
      const filteredResults = results.filter(result => result !== null);
      const totalResults = ids.length;
      res.status(200).json({
        totalResults,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalResults / perPage),
        fundingRequests: filteredResults
      });
    })
    .catch(error => {
      console.error('Error retrieving funding requests:', error);
      res.status(500).json({ error: 'Failed to retrieve funding requests.' });
    });
});


router.get('/getFundingRequests/:investorId/:interestStatus', (req, res) => {
  const investorId = req.params.investorId;
  const interestStatus = req.params.interestStatus;

  const dataRefi = db.ref(`investors/${investorId}/interest`);

  dataRefi.orderByChild('interestStatus').equalTo(interestStatus).once('value', (snapshot) => {
    if (snapshot.exists()) {
      const result = [];
      snapshot.forEach(childSnapshot => {
        result.push({
          fundingRequestId: childSnapshot.val().fundingRequestId,
          date: childSnapshot.val().date,
        });
      });
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: 'No funding requests found with the specified status.' });
    }
  }).catch((error) => {
    console.error('Error retrieving funding requests:', error);
    res.status(500).json({ error: 'Failed to retrieve funding requests.' });
  });
});
router.post('/sendPasswordResetEmail', async (req, res) => {
  const email = req.body.email;

  try {
    // Attempt to retrieve the user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Extract the first name from the user record
    const firstName = userRecord.firstName;

    // Generate a password reset link
    const reset = await admin.auth().generatePasswordResetLink(email);
    console.log(reset);

    // Send the email with the reset link and user's first name
    client.sendEmailWithTemplate({
      From: 'info@koppoh.com',
      To: email,
      TemplateId: '34126584',
      TemplateModel: {
        reset,
        firstName 
      },
    })
    .then((response) => {
      console.log('Verified successfully:', response);
      res.status(201).json({ message: 'Verification email sent successfully' });
    })
    .catch((error) => {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'Email sending error' });
    });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('Password reset link generation error: User not found');
      res.status(404).json({ error: 'User not found' });
    } else {
      console.error('Password reset link generation error:', error);
      res.status(400).json({ error: 'Password reset link generation failed' });
    }
  }
});
  

  router.get('/user-details', (req, res) => {
    const { userId } = req.query;

    // Check if userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Retrieve user details for the given userId
    const db = admin.database();
    const investorsRef = db.ref('investors');

    investorsRef.child(userId).once('value')
        .then(snapshot => {
            // Check if user exists
            if (!snapshot.exists()) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userDetails = snapshot.val();

            var user = userDetails

            // Determine profile completeness
            const isProfileComplete = (userDetails) => {
              console.log(userDetails);
          
              const commonFields = ['firstName', 'lastName', 'country', 'phoneNumber'];
          
              // Helper function to find missing fields
              const findMissingFields = (fields) => {
                  return fields.filter(field => !(field in userDetails));
              };
          
              if (userDetails.organisation) {
                  const organisationFields = ['website', 'investmentstage', 'portfolio', 'deals'];
                  const allFields = commonFields.concat(organisationFields);
                  const missingFields = findMissingFields(allFields);
          
                  if (missingFields.length > 0) {
                      console.log("Missing fields:", missingFields);
                  }
          
                  return missingFields.length === 0;
              } else {
                  const individualFields = ['website', 'stage', 'recentPortfolio', 'deals'];
                  const allFields = commonFields.concat(individualFields);
                  const missingFields = findMissingFields(allFields);
          
                  if (missingFields.length > 0) {
                      console.log("Missing fields:", missingFields);
                  }
          
                  return missingFields.length === 0;
              }
          };
          

            const profileComplete = isProfileComplete(userDetails);
            console.log(profileComplete)

            // Return user details along with profile completeness
            return res.status(200).json({ 
                userDetails,
                profileComplete: profileComplete ? true : false 
            });
        })
        .catch(error => {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Server error' });
        });
});


  router.post('/idverify-email', (req, res) => {
    const { userId } = req.body;

    // Check if userId is provided
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Update emailVerification to true for the given userId
    const db = admin.database();
    const investorsRef = db.ref('investors');

    investorsRef.child(userId).once('value')
        .then(snapshot => {
            // Check if user exists
            if (!snapshot.exists()) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update emailVerification to true
            investorsRef.child(userId).update({ emailVerification: true }, error => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Email verification updated successfully
                return res.status(200).json({ message: 'Email verification updated successfully' });
            });
        })
        .catch(error => {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Server error' });
        });
});

  router.post('/signup', (req, res) => {
    const { firstName, lastName, email, password, organisation } = req.body;

    // Generate a unique verification token
    function generateRandomNumber() {
        return Math.floor(Math.random() * 900000) + 100000;
      }
      // Call the function to generate a random 6-digit number
    
    var verificationToken = generateRandomNumber()
    console.log(verificationToken);
    admin
        .auth()
        .getUserByEmail(email)
        .then(() => {
            // If the email already exists, return an error response
            res.status(400).json({ error: 'Email already exists' });
        })
        .catch((getUserError) => {
            if (getUserError.code === 'auth/user-not-found') {
                // If the email does not exist, create a new user in Firebase Authentication
                admin
                    .auth()
                    .createUser({
                        email,
                        password,
                    })
                    .then((userRecord) => {
                        // User signed up successfully
                        const emailVerification = false;
                        const firstTime = true;
                        const currentDate = new Date();
                        const dateInSeconds = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000);

                        const userData = {
                            firstName,
                            lastName,
                            email,
                            uid: userRecord.uid,
                            emailVerification,
                            firstTime,
                            Date: currentDate.toISOString(),
                            signupdate: dateInSeconds,
                            verificationToken, // Add verification token to user data
                            organisation: organisation || null, // Make organisation optional
                        };

                        // Store user data in Firebase Realtime Database under "investors" node
                        const db = admin.database();
                        const investorsRef = db.ref('investors');

                        try {
                            investorsRef.child(userRecord.uid).set(userData, (error) => {
                                if (error) {
                                    // Handle database error
                                    console.error('Database error:', error);
                                    res.status(500).json({ error: 'Database error' });
                                } else {
                                    // Send verification email with link
                                    const verificationLink = `https://investor-dev.netlify.app/auth/verify-email?email${email}&token=${verificationToken}`;
                                    
                                    sendVerificationEmail(email,firstName, verificationLink);

                                    // Data stored successfully

                                    res.status(201).json({ message: 'Signup successful', user: userData });
                                }
                            });
                        } catch (databaseError) {
                            // Handle any unexpected database error
                            console.error('Unexpected database error:', databaseError);
                            res.status(500).json({ error: 'Server error' });
                        }
                    })
                    .catch((signupError) => {
                        // Handle signup errors
                        console.error('Signup error:', signupError);
                        res.status(400).json({ error: 'Signup failed' });
                    });
            } else {
                // Handle other errors that may occur while checking the email
                console.error('Email check error:', getUserError);
                res.status(500).json({ error: 'Server error' });
            }
        });
});
router.post('/resend-verification', (req, res) => {
  const { email } = req.body;

  admin
      .auth()
      .getUserByEmail(email)
      .then((userRecord) => {
          // If user exists, resend verification email
          const verificationToken = Math.floor(Math.random() * 900000) + 100000; // Generate new verification token
          const verificationLink = `https://investor-dev.netlify.app/auth/reset-password?email=${email}&token=${verificationToken}`;
          console.log(verificationLink)
          sendVerificationEmail(email, userRecord.firstName, verificationLink);

          // Update verification token in user data
          const db = admin.database();
          const investorsRef = db.ref('investors');
          const currentDate = new Date();
          const signupdate = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000);
          investorsRef.child(userRecord.uid).update({ verificationToken });

          investorsRef.child(userRecord.uid).update({ signupdate });
           console.log("debe")
          res.status(200).json({ message: 'Verification email resent successfully' });
      })
      .catch((error) => {
          if (error.code === 'auth/user-not-found') {
              // If user doesn't exist, return an error response
              res.status(404).json({ error: 'User not found' });
          } else {
              // Handle other errors
              console.error('Resend verification error:', error);
              res.status(500).json({ error: 'Server error' });
          }
      });
});

// Helper function to send verification email
function sendVerificationEmail(email, firstName, verificationLink) {
    client.sendEmailWithTemplate({
        From: 'info@koppoh.com',
        To: email,
        TemplateId: '33232370',
        TemplateModel: {
            verificationLink,
            firstName
        },
    })
    .catch((error) => {
        console.error('Email sending error:', error);
    });
}

// Router endpoint to handle email verification
router.get('/confirm-verification', (req, res) => {
  const { email, token } = req.query;

  // Get the user data from the Realtime Database
  const db = admin.database();
  const investorsRef = db.ref('investors');

  investorsRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
      const userData = snapshot.val();
      if (!userData) {
          // If the email doesn't exist, return an error response
          return res.status(404).json({ error: 'Email not found' });
      }

      // If the email exists, check if the verification token matches
      const userId = Object.keys(userData)[0];
      const storedToken = userData[userId].verificationToken;
      const signupdate = userData[userId].signupdate;

      console.log(storedToken)


      console.log(token)

     var tokenx = parseFloat(token);

      // Check if the token matches and the signupdate is within the last 30 minutes
      if (tokenx == storedToken) {
          const currentTimeInSeconds = Math.floor(Date.now() / 1000);
          const timeDifference = currentTimeInSeconds - signupdate;
          const thirtyMinutesInSeconds = 30 * 60; // 30 minutes in seconds

          if (timeDifference <= thirtyMinutesInSeconds) {
              // Update email verification status
              investorsRef.child(userId).update({ emailVerification: true });

              res.status(200).json({ message: 'Email verification successful' });
          } else {
              // If more than 30 minutes have passed, return an error
              res.status(400).json({ error: 'Verification link expired' });
          }
      } else {
          res.status(400).json({ error: 'Invalid verification token' });
      }
  })
  .catch((error) => {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Server error' });
  });
});

router.get('/confirm-email', async (req, res) => {
  const { email, token } = req.query;

  try {
    // Fetch the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const db = admin.database();
    const usersRef = db.ref('users');
    const userSnapshot = await usersRef.child(userRecord.uid).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if the token matches
    if (userData.verificationToken !== parseInt(token)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Check if the verification is within 30 minutes
    const currentTimeInSeconds = Math.floor(new Date().getTime() / 1000);
    const timeDifference = currentTimeInSeconds - userData.signupdate;

    if (timeDifference > 1800) { // 1800 seconds = 30 minutes
      return res.status(400).json({ error: 'Verification link expired' });
    }

    // Update the user's email verification status
    await usersRef.child(userRecord.uid).update({ emailVerification: true });

    // Respond with success
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/check-email', async (req, res) => {
    const { email } = req.body;
   console.log(email)
    const emailCheckResult = await checkEmailExistence(email);
  
    if (emailCheckResult.exists) {
      res.status(200).json({ message: emailCheckResult.message });
    } else {
      res.status(404).json({ message: emailCheckResult.message });
    }
  });



// Function to generate a random 6-digit number
function generateRandomNumber() {
    return Math.floor(Math.random() * 900000) + 100000;
}


router.put('/updateInvestorProfileIndividual/:uid', upload.single('logo'), (req, res) => {
  const userId = req.params.uid;
  const {
    firstName, lastName, country, phoneNumber, website, linkedIn, stage, recentPortfolio, deals
  } = req.body;

  // Handle image upload and generate a download URL
  let logoFileName = '';

  if (req.file) {
    console.log("Uploading image...,");

    logoFileName = `logo_${userId}_${Date.now()}a.jpg`; // Change the naming convention as needed
    const bucket = admin.storage().bucket();
    const file = bucket.file(logoFileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('finish', () => {
      console.log("Image uploaded successfully.");
      // Generate a download URL for the uploaded image
      file.getSignedUrl({ action: 'read', expires: '03-01-2500' })
        .then(downloadUrls => {
          const imageUrl = downloadUrls[0];
          // Collect updated user data including the new logo URL
          const updatedUserData = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(country && { country }),
            ...(phoneNumber && { phoneNumber }),
            ...(website && { website }),
            ...(linkedIn && { linkedIn }),
            ...(stage && { stage }),
            ...(recentPortfolio && { recentPortfolio }),
            ...(deals && { deals }),
            logoUrl: imageUrl, // Always include the logo URL
          };

          updateUserProfile(userId, updatedUserData, res);
        })
        .catch(error => {
          console.error("Error generating download URL:", error);
          res.status(500).json({ error: 'Failed to generate image URL.' });
        });
    });

    stream.on('error', (err) => {
      console.error("Error uploading image:", err);
      res.status(500).json({ error: 'Failed to upload image.' });
    });

    stream.end(req.file.buffer);
  } else {
    console.log("No file to upload.");
    // Collect updated user data without new logo URL
    const updatedUserData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(country && { country }),
      ...(phoneNumber && { phoneNumber }),
      ...(website && { website }),
      ...(linkedIn && { linkedIn }),
      ...(stage && { stage }),
      ...(recentPortfolio && { recentPortfolio }),
      ...(deals && { deals })
    };

    // Include the existing logo URL if it already exists in the database
    const db = admin.database();
    const usersRef = db.ref('investors');

    usersRef.child(userId).once('value', (snapshot) => {
      const existingUserData = snapshot.val();
      if (existingUserData && existingUserData.logoUrl) {
        updatedUserData.logoUrl = existingUserData.logoUrl;
      }

      updateUserProfile(userId, updatedUserData, res);
    });
  }
});

function updateUserProfile(userId, updatedUserData, res) {
  const db = admin.database();
  const usersRef = db.ref('investors');

  usersRef.child(userId).update(updatedUserData)
    .then(() => {
      // Calculate profile completeness
      let count = 0;

      if (updatedUserData.firstName) count++;
      if (updatedUserData.lastName) count++;
      if (updatedUserData.country) count++;
      if (updatedUserData.phoneNumber) count++;
      if (updatedUserData.website) count++;
      if (updatedUserData.linkedIn) count++;
      if (updatedUserData.stage) count++;
      if (updatedUserData.recentPortfolio) count++;
      if (updatedUserData.deals) count++;
      if (updatedUserData.logoUrl) count++;

      const profileCompleteness = (count / 10) * 100;
      

      res.status(200).json({ message: 'User information updated successfully', "profileCompleteness ": profileCompleteness  });
    })
    .catch((error) => {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user information' });
    });
}

router.put('/updateInvestorProfileCompany/:uid', upload.single('logo'), (req, res) => {
  const userId = req.params.uid;
  const { firstName, lastName, country, phoneNumber, linkedIn, role } = req.body;


  console.log(linkedIn)
  // Handle image upload and generate a download URL
  let logoFileName = '';

  if (req.file) {
    console.log("Uploading image...");

    logoFileName = `logo_${userId}_${Date.now()}a.jpg`; // Change the naming convention as needed
    const bucket = admin.storage().bucket();
    const file = bucket.file(logoFileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('finish', () => {
      console.log("Image uploaded successfully.");
      // Generate a download URL for the uploaded image
      file.getSignedUrl({ action: 'read', expires: '03-01-2500' })
        .then(downloadUrls => {
          const imageUrl = downloadUrls[0];
          // Collect updated user data including the new logo URL
          const updatedUserData = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(country && { country }),
            ...(phoneNumber && { phoneNumber }),
            ...(linkedIn && { linkedIn }),
            ...(role && { role }),
            logoUrl: imageUrl, // Always include the logo URL
          };

          updateCompanyProfile(userId, updatedUserData, res);
        })
        .catch(error => {
          console.error("Error generating download URL:", error);
          res.status(500).json({ error: 'Failed to generate image URL.' });
        });
    });

    stream.on('error', (err) => {
      console.error("Error uploading image:", err);
      res.status(500).json({ error: 'Failed to upload image.' });
    });

    stream.end(req.file.buffer);
  } else {
    console.log("No file to upload.");
    // Collect updated user data without new logo URL
    const updatedUserData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(country && { country }),
      ...(phoneNumber && { phoneNumber }),
      ...(linkedIn && { linkedIn }),
      ...(role && { role })
    };

    // Include the existing logo URL if it already exists in the database
    const db = admin.database();
    const usersRef = db.ref('companies');

    usersRef.child(userId).once('value', (snapshot) => {
      const existingUserData = snapshot.val();
      if (existingUserData && existingUserData.logoUrl) {
        updatedUserData.logoUrl = existingUserData.logoUrl;
      }

      updateCompanyProfile(userId, updatedUserData, res);
    });
  }
});

function updateCompanyProfile(userId, updatedUserData, res) {
  const db = admin.database();
  const usersRef = db.ref('investors');

  usersRef.child(userId).update(updatedUserData)
    .then(() => {
      // Calculate profile completeness
      let count = 0;

      if (updatedUserData.firstName) count++;
      if (updatedUserData.lastName) count++;
      if (updatedUserData.country) count++;
      if (updatedUserData.phoneNumber) count++;
      if (updatedUserData.linkedIn) count++;
      if (updatedUserData.role) count++;
      if (updatedUserData.logoUrl) count++;

      const profileCompleteness = (count / 10) * 100;

      res.status(200).json({ message: 'Company information updated successfully', "profileCompleteness": profileCompleteness });
    })
    .catch((error) => {
      console.error('Update company error:', error);
      res.status(500).json({ error: 'Failed to update company information' });
    });
}


 
router.put('/update-investorCompany/:uid', (req, res) => {
  const userId = req.params.uid; // Get the user's UID from the URL
  const { 
      organizationName, 
      about,
      website,
      investorType, 
      organizationWebsite, 
      yearFounded, 
      numberOfEmployees, 
      regionHQ, 
      countryHQ, 
      localAddress, 
      vision, 
      mission, 
      values, 
      portfolio, 
      deals ,
      investmentstage
  } = req.body;

  // Check if the provided data is available for update
  const updatedUserData = {};

  if (organizationName !== undefined) {
    updatedUserData.organizationName = organizationName;
  }
  if (investorType !== undefined) {
    updatedUserData.investorType = investorType;
  }
  if (organizationWebsite !== undefined) {
    updatedUserData.organizationWebsite = organizationWebsite;
  }
  if (yearFounded !== undefined) {
    updatedUserData.yearFounded = yearFounded;
  }
  if (numberOfEmployees !== undefined) {
    updatedUserData.numberOfEmployees = numberOfEmployees;
  }
  if (regionHQ !== undefined) {
    updatedUserData.regionHQ = regionHQ;
  }
  if (countryHQ !== undefined) {
    updatedUserData.countryHQ = countryHQ;
  }
  if (localAddress !== undefined) {
    updatedUserData.localAddress = localAddress;
  }
  if (vision !== undefined) {
    updatedUserData.vision = vision;
  }
  if (mission !== undefined) {
    updatedUserData.mission = mission;
  }
  if (values !== undefined) {
    updatedUserData.values = values;
  }
  if (portfolio !== undefined) {
    updatedUserData.portfolio = portfolio;
  }
  if (deals !== undefined) {
    updatedUserData.deals = deals;
  }
  if (about !== undefined) {
    updatedUserData.about = about;
  }
  if (website !== undefined) {
    updatedUserData.website = website;
  }
  if ( investmentstage !== undefined) {
    updatedUserData.investmentstage =  investmentstage
    ;
  }

 
  // Update the user's data in the Firebase Realtime Database
  const db = admin.database();
  const usersRef = db.ref('investors');

  usersRef
    .child(userId)
    .update(updatedUserData)
    .then(() => {
      // Calculate profile completeness
      let count = 0;
      const requiredFields = [
        'organizationName', 
        'investorType', 
        'organizationWebsite', 
        'yearFounded', 
        'numberOfEmployees', 
        'regionHQ', 
        'countryHQ', 
        'localAddress', 
        'vision', 
        'mission', 
        'values', 
        'portfolio', 
        'deals',
        'about',
        'website',
        ' investmentstage'
      ];

      // Implementation for calculating profile completeness would go here

      res.status(200).json({ message: 'User information updated successfully' });
    })
    .catch((error) => {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user information' });
    });
});


router.post('/update-password', (req, res) => {
    const { email, newPassword } = req.body;

    // Check if the email exists in Firebase Authentication
    admin
        .auth()
        .getUserByEmail(email)
        .then((userRecord) => {
            // If the user exists, update their password
            admin
                .auth()
                .updateUser(userRecord.uid, {
                    password: newPassword
                })
                .then(() => {
                    res.status(200).json({ message: 'Password updated successfully' });
                })
                .catch((updateError) => {
                    // Handle password update errors
                    console.error('Password update error:', updateError);
                    res.status(500).json({ error: 'Password update failed' });
                });
        })
        .catch((getUserError) => {
            // If the email doesn't exist, return an error response
            if (getUserError.code === 'auth/user-not-found') {
                res.status(404).json({ error: 'User not found' });
            } else {
                // Handle other errors that may occur while checking the email
                console.error('Email check error:', getUserError);
                res.status(500).json({ error: 'Server error' });
            }
        });
});


router.put('/update-dealcriteria/:uid', (req, res) => {
  const userId = req.params.uid; // Get the user's UID from the URL
  const { 
      fundname, 
      totalfund, 
      availablefund, 
      fundkickoff, 
      dealsizemin, 
      dealsizemax, 
      preferredindustry, 
      businessstage, 
      investmentstage, 
      businessmodel, 
      gendercomposition, 
      region, 
      country,
      currency
  } = req.body;

  // Check if the provided data is available for update
  const updatedDealCriteria = {};

  if (fundname) {
      updatedDealCriteria.fundname = fundname;
  }
  if (totalfund) {
      updatedDealCriteria.totalfund = totalfund;
  }
  if (availablefund) {
      updatedDealCriteria.availablefund = availablefund;
  }
  if (fundkickoff) {
      updatedDealCriteria.fundkickoff = fundkickoff;
  }
  if (dealsizemin) {
      updatedDealCriteria.dealsizemin = dealsizemin;
  }
  if (dealsizemax) {
      updatedDealCriteria.dealsizemax = dealsizemax;
  }
  if (preferredindustry) {
      updatedDealCriteria.preferredindustry = preferredindustry;
  }
  if (businessstage) {
      updatedDealCriteria.businessstage = businessstage;
  }
  if (investmentstage) {
      updatedDealCriteria.investmentstage = investmentstage;
  }
  if (businessmodel) {
      updatedDealCriteria.businessmodel = businessmodel;
  }
  if (gendercomposition) {
      updatedDealCriteria.gendercomposition = gendercomposition;
  }
  if (region) {
      updatedDealCriteria.region = region;
  }
  if (country) {
      updatedDealCriteria.country = country;
  }
  if (currency) {
    updatedDealCriteria.country = currency;
}
  
console.log(updatedDealCriteria,userId)

  // Update the deal criteria in the Firebase Realtime Database
  const db = admin.database();
  const dealCriteriaRef = db.ref(`investors/${userId}/dealCriteria`);

  dealCriteriaRef.update(updatedDealCriteria)
      .then(() => {
          res.status(200).json({ message: 'Deal criteria updated successfully' });
      })
      .catch((error) => {
          console.error('Update deal criteria error:', error);
          res.status(500).json({ error: 'Failed to update deal criteria' });
      });
});




module.exports = router;