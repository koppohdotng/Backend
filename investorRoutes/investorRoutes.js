const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
// const crypto = require('crypto');


// Initialize Firebase Admin SDK with your service account key

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");


router.post('/sendPasswordResetEmail', async (req, res) => {
    const email = req.body.email;
  
    try {
  
      const userRecord = await admin.auth().getUserByEmail(email);
        
        // Get the userId from the userRecord
        const firstName = userRecord.firstName;
      // Generate a password reset link
      const reset = await admin.auth().generatePasswordResetLink(email);
      console.log(reset);
  
      // Configure email data
      
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
        console.log('Verified  successfully:', response);
        res.status(201).json({ message: 'Verified successful',});
      })
      .catch((error) => {
        console.error('Email sending error:', error);
        res.status(500).json({ error: 'Email sending error' });
      });
  
     
    }
     catch (error) {
      console.error('Password reset link generation error:', error);
      res.status(400).json({ error: 'Password reset link generation failed' });
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

            // Return user details
            return res.status(200).json({ userDetails });
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
                                    const verificationLink = `https://koppohstaging-070b5668de51.herokuapp.com/confirm-verification?email=${email}&token=${verificationToken}`;
                                    
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
          const verificationLink = `https://koppohstaging-070b5668de51.herokuapp.com/confirm-verification?email=${email}&token=${verificationToken}`;
          console.log(verificationLink)
          sendVerificationEmail(email, userRecord.firstName, verificationLink);

          // Update verification token in user data
          const db = admin.database();
          const investorsRef = db.ref('investors');
          investorsRef.child(userRecord.uid).update({ verificationToken });

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




 

module.exports = router;