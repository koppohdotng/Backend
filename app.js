const express = require('express');
const app = express();
const cors = require('cors');
const admin = require('firebase-admin');
const authRoutes = require('./routes/auth');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
// const verifyGoogleIdToken = require('./google-signin');



app.use(cors());

const port = process.env.PORT || 3000; // You can change this port to any other port you prefer
app.use(bodyParser.json());

// Use the authentication routes defined in auth.js

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;

  // Query the database to retrieve user information using the userId
  const userRef = admin.database().ref(`/users/${userId}`);

  userRef.once('value', (snapshot) => {
    const user = snapshot.val();
    if (user) {
      res.status(200).json({ message: 'Authentication successful', user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});


app.post('/google-signin', async (req, res) => {
    const { idToken } = req.body;
  
    try {
      const user = await verifyGoogleIdToken(idToken);
  
      // You can use the user information (user.email, user.name, etc.) for authentication
      // Example: Authenticate the user in your database or create a session
  
      res.status(200).json({ message: 'Google Sign-In successful', user });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      res.status(401).json({ error: 'Google Sign-In failed' });
    }
  });

  // Define an endpoint to add a notification to a user's data.
  app.post('/addNotification/:userId', (req, res) => {
    const userId = req.params.userId;
    const notification = req.body.notification;
  
    if (!notification) {
      return res.status(400).json({ error: 'Notification is required.' });
    }
  
    // Add a "seenNotification" field with a default value of false
    notification.seenNotification = false;
  
    const notificationsRef = admin.database().ref(`users/${userId}/notifications`);
    const newNotificationRef = notificationsRef.push();
  
    // Add the current timestamp to the notification data
    const timestamp = new Date().toISOString();
    notification.timestamp = timestamp;
  
    // Set the notification data in the database
    newNotificationRef.set(notification, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to add notification.' });
      } else {
        return res.status(200).json({ message: 'Notification added successfully.' });
      }
    });
  });
  
  app.post('/request/:userId', (req, res) => {
    const userId = req.params.userId;
    const  request = req.body.request;

    if (! request || !Array.isArray(request) || request.length === 0) {
        return res.status(400).json({ error: 'Request array is required and should not be empty.' });
    }

    const  requestRef = admin.database().ref(`users/${userId}/request`);
    const timestamp = new Date().toISOString();

    const promises = [];

    request.forEach(request => {
        if (!request) {
            return;
        }

        // Add a "seenNotification" field with a default value of false
        request.seenNotification = false;

        const newRequestRef =  requestRef.push();

        // Add the current timestamp to the notification data
        request.timestamp = timestamp;

        // Create a promise for setting each notification
        const setrequestPromise = new Promise((resolve, reject) => {
            newrequestRef.set( request, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        promises.push(setrequestPromise);
    });

    Promise.all(promises)
        .then(() => {
            return res.status(200).json({ message: ' Request added successfully.' });
        })
        .catch((error) => {
            return res.status(500).json({ error: 'Failed to add one or more Request.' });
        });
});



  app.patch('/update-notification/:userId/:notificationId', (req, res) => {
    const userId = req.params.userId;
    const notificationId = req.params.notificationId;
    const updateData = req.body;
  
    if (!notificationId || !userId || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Invalid request data.' });
    }
  
    const notificationRef = admin.database().ref(`users/${userId}/notifications/${notificationId}`);
  
    // Check if the specified notification exists
    notificationRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        // Update the notification data
        notificationRef.update(updateData, (error) => {
          if (error) {
            return res.status(500).json({ error: 'Failed to update notification.' });
          } else {
            return res.status(200).json({ message: 'Notification updated successfully.' });
          }
        });
      } else {
        return res.status(404).json({ error: 'Notification not found.' });
      }
    });
  });
  app.get('/get-notifications/:userId', (req, res) => {
    const userId = req.params.userId;
    const notificationsRef = admin.database().ref(`users/${userId}/notifications`);
  
    notificationsRef.once('value', (snapshot) => {
      const notifications = snapshot.val();
  
      if (notifications) {
        const notificationsArray = Object.values(notifications);
        return res.status(200).json(notificationsArray);
      } else {
        return res.status(404).json({ error: 'No notifications found for the user.' });
      }
    });
  });
  



app.use('/auth', authRoutes);

app.put('/api/update-user/:uid', (req, res) => {
  const userId = req.params.uid; // Get the user's UID from the URL
  const { firstName, lastName, country, phoneNumber, role, linkedIn } = req.body;

  // Check if the provided data is available for update
  const updatedUserData = {};

  if (firstName) updatedUserData.firstName = firstName;
  if (lastName) updatedUserData.lastName = lastName;
  if (country) updatedUserData.country = country;
  if (phoneNumber) updatedUserData.phoneNumber = phoneNumber;
  if (role) updatedUserData.role = role;
  if (linkedIn) updatedUserData.linkedIn = linkedIn;

  // Update the user's data in the Firebase Realtime Database
  const db = admin.database();
  const usersRef = db.ref('users');

  usersRef
    .child(userId)
    .update(updatedUserData)
    .then(() => {
      res.status(200).json({ message: 'User information updated successfully' });
    })
    .catch((error) => {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user information' });
    });
});



 // Initialize Firebase Realtime Database
const db = admin.database();
const teammatesRef = db.ref('users'); // Reference to the 'teammates' node in your database

// Initialize Multer for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API endpoint to add a new teammate
app.post('/api/addTeammate/:userId', upload.single('image'), (req, res) => {  
  const userId = req.params.userId;
  const { name, role } = req.body;

  // Check if name and role are provided (compulsory fields)
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are compulsory fields.' });
  }

  // Generate a unique filename for the image (e.g., using a timestamp)
  const timestamp = Date.now();
  const imageName = `${timestamp}_${req.file.originalname}`;

  // Create a new teammate object
  const newTeammate = {
    name,
    role,
    imageURL: '', // Initialize the imageURL field
  };

  // If an image is provided, store it in Firebase Storage and add its download URL to the teammate object
  if (req.file) {
    const bucket = admin.storage().bucket();

    const imageBuffer = req.file.buffer;

    const file = bucket.file(imageName); // Use the generated filename

    const blobStream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      return res.status(500).json({ error: 'Error uploading the image.' });
    });

    blobStream.on('finish', () => {
      // Get the download URL for the uploaded image
      file.getSignedUrl({ action: 'read', expires: '01-01-2030' }, (error, downloadUrl) => {
        if (error) {
          return res.status(500).json({ error: 'Error getting download URL.' });
        }

        newTeammate.imageURL = downloadUrl;

        // Add the new teammate to the database under the specified user ID
        teammatesRef.child(`${userId}/Teammate`).push(newTeammate, (error) => {
          if (error) {
            return res.status(500).json({ error: 'Error adding teammate to the database.' });
          }

          return res.status(200).json({ message: 'Teammate added successfully.' });
        });
      });
    });

    blobStream.end(imageBuffer);
  } else {
    // If no image is provided, add the teammate object to the database directly
    teammatesRef.child(userId).push(newTeammate, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Error adding teammate to the database.' });
      }

      return res.status(200).json({ message: 'Teammate added successfully.' });
    });
  }
});




const dataRef = db.ref('users'); // Change to your database reference



//Define an API route for updating user data
app.put('/updateUserData/:userId', upload.single('logo'), (req, res) => {
  const userId = req.params.userId;
  const {
    businessName,
    companyVision,
    registrationStatus,
    businessType,
    businessRCNumber,
    yearOfIncorporation,
    businessSector,
  } = req.body;

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
          // Create a user data object with only the provided fields
          const businessData = {
            ...(businessName && { businessName }),
            ...(companyVision && { companyVision }),
            ...(registrationStatus && { registrationStatus }),
            ...(businessType && { businessType }),
            ...(businessRCNumber && { businessRCNumber }),
            ...(yearOfIncorporation && { yearOfIncorporation }),
            ...(businessSector && { businessSector }),
            logoUrl: imageUrl, // Always include the logo URL
          };

          dataRef.child(userId).update(businessData, (error) => {
            if (error) {
              res.status(500).json({ error: 'Failed to update user data.' });
            } else {
              res.status(200).json({ message: 'User data updated successfully.' });
            }
          });
        })
        .catch(error => {
          console.error("Error generating download URL:", error);
          res.status(500).json({ error: 'Failed to generate image URL.' });
        });
    });

    stream.on('error', (err) => {
      console.error("Error uploading image:", err);
      // Handle the error, e.g., by sending an error response.
      res.status(500).json({ error: 'Failed to upload image.' });
    });

    stream.end(req.file.buffer);
  } else {
    console.log("No file to upload.");
    // Create a user data object with only the provided fields when no image is uploaded
    const businessData = {
      ...(businessName && { businessName }),
      ...(companyVision && { companyVision }),
      ...(registrationStatus && { registrationStatus }),
      ...(businessType && { businessType }),
      ...(businessRCNumber && { businessRCNumber }),
      ...(yearOfIncorporation && { yearOfIncorporation }),
      ...(businessSector && { businessSector }),
    };

    // Include the logo URL if it already exists in the database
    dataRef.child(userId).once('value', (snapshot) => {
      const existingUserData = snapshot.val();
      if (existingUserData && existingUserData.logoUrl) {
        businessData.logoUrl = existingUserData.logoUrl;
      }

      // Update the user data
      dataRef.child(userId).update(businessData, (error) => {
        if (error) {
          res.status(500).json({ error: 'Failed to update user data.' });
        } else {
          res.status(200).json({ message: 'User data updated successfully.' });
        }
      });
    });
  }
});


const dataRefz = db.ref('addMilestone'); // Change to your database reference

//Define an API route for adding a new milestone
app.post('/addMilestone/:userId', (req, res) => {
  const userId = req.params.userId;
  const {  milestoneDescription, milestoneDate } = req.body;

  // Create a new milestone object
  const newMilestone = {
    
    description: milestoneDescription,
    date: milestoneDate,
  };

  // Push the new milestone to the user's milestones array
  dataRef.child(`${userId}/milestones`).push(newMilestone, (error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to add a new milestone.' });
    } else {
      res.status(200).json({ message: 'New milestone added successfully.' });
    }
  });
});

//API LOAN request
// Function to generate a unique file name
function generateUniqueFileName(originalName) {
  const fileExtension = path.extname(originalName);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + fileExtension;
}

// Set up multer for file uploads
const storages = multer.memoryStorage({
  filename: (req, file, callback) => {
    // Check if a file was uploaded
    if (file) {
      const uniqueFileName = generateUniqueFileName(file.originalname);
      callback(null, uniqueFileName);
    } else {
      // No file was uploaded, use the original name
      callback(null, file.originalname);
    }
  },
});

// Create an endpoint for uploading PDF documents
app.post('/api/loanRequest', upload.fields([
  { name: 'businessPlan', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'cashFlowAnalysis', maxCount: 1 },
  { name: 'financial', maxCount: 1 },
]), (req, res) => {
  try {
    const {
      date,
      problem,
      solution,
      stage,
      currency,
      fundingAmount,
      useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
      financials,
    } = req.body;

    // Extract file objects from the request
    const businessPlanFile = req.files['businessPlan'] ? req.files['businessPlan'][0] : null;
    const bankStatementFile = req.files['bankStatement'] ? req.files['bankStatement'][0] : null;
    const cashFlowAnalysisFile = req.files['cashFlowAnalysis'] ? req.files['cashFlowAnalysis'][0] : null;
    const financialFile = req.files['financial'] ? req.files['financial'][0] : null;

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Push the new entry to the database
    const newEntryRef = entriesRef.push();
    const entryId = newEntryRef.key;

    // Store file URLs in the database if files are available
    const fileUrls = {};
    if (businessPlanFile) {
      fileUrls.businessPlan = `https://koppoh-4e5fb.appspot.com/${entryId}/businessPlan.pdf`;
    }
    if (bankStatementFile) {
      fileUrls.bankStatement = `https://koppoh-4e5fb.appspot.com/${entryId}/bankStatement.pdf`;
    }
    if (cashFlowAnalysisFile) {
      fileUrls.cashFlowAnalysis = `https://koppoh-4e5fb.appspot.com/${entryId}/cashFlowAnalysis.pdf`;
    }
    if (financialFile) {
      fileUrls.financial = `https://koppoh-4e5fb.appspot.com/${entryId}/financial.pdf`;
    }

    const entryData = {
      date,
      problem,
      solution,
      stage,
      currency,
      fundingAmount,
      useOfFunds: {
        product,
        saleAndMarketing,
        researchAndDevelopment,
        capitalExpenditure,
        operation,
        other,
      },
      financials,
      fileUrls,
    };

    newEntryRef.set(loanRequest, (error) => {
      if (error) {
        res.status(500).json({ error: 'Failed to store data in the database' });
      } else {
        res.status(201).json({ message: 'Data stored successfully' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

app.post('/api/equitRequest', upload.fields([
  { name: 'pitchdeck', maxCount: 1 },
  { name: 'valuation', maxCount: 1 },
  { name: 'captable', maxCount: 1 },
  { name: 'financialmodel', maxCount: 1 },
  { name: 'founderagreement', maxCount: 1 },
  { name: 'taxclearance', maxCount: 1 },
]), (req, res) => {
  try {
    const {
      date,
      problem,
      solution,
      stage,
      investmentStage,
      currency,
      fundingAmount,
      useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
      financials,
    } = req.body;

    // Extract file objects from the request
    const Pitchdeck = req.files['pitchdeck'] ? req.files['pitchdeck'][0] : null;
    const Valuation = req.files['valuation'] ? req.files['valuation'][0] : null;
    const captable = req.files['captable'] ? req.files['captable'][0] : null;
    const financialmodel = req.files['financialmodel'] ? req.files['financialmodel'][0] : null;
    const founderagreement = req.files['founderagreement'] ? req.files['founderagreement'][0] : null;
    const taxclearance = req.files['taxclearance'] ? req.files['taxclearance'][0] : null;

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Push the new entry to the database
    const newEntryRef = entriesRef.push();
    const entryId = newEntryRef.key;

    // Store file URLs in the database if files are available
    const fileUrls = {};
    if (businessPlanFile) {
      fileUrls.pitchdeck = `https://koppoh-4e5fb.appspot.com/${entryId}/pitchdeck.pdf`;
    }
    if (bankStatementFile) {
      fileUrls.valuation = `https://koppoh-4e5fb.appspot.com/${entryId}/valuation.pdf`;
    }
    if (cashFlowAnalysisFile) {
      fileUrls.captable = `https://koppoh-4e5fb.appspot.com/${entryId}/captable.pdf`;
    }
    if (financialFile) {
      fileUrls.financialmodel = `https://koppoh-4e5fb.appspot.com/${entryId}/financialmodel.pdf`;
    }
    if (financialFile) {
      fileUrls.founderagreement = `https://koppoh-4e5fb.appspot.com/${entryId}/founderagreement.pdf`;
    }
    if (financialFile) {
      fileUrls.taxclearance = `https://koppoh-4e5fb.appspot.com/${entryId}/taxclearance.pdf`;
    }
    const entryData = {
      date,
      problem,
      solution,
      stage,
      investmentStage,
      currency,
      fundingAmount,
      useOfFunds: {
        product,
        saleAndMarketing,
        researchAndDevelopment,
        capitalExpenditure,
        operation,
        other,
      },
      financials,
      fileUrls,
    };

    newEntryRef.set(equitRequest, (error) => {
      if (error) {
        res.status(500).json({ error: 'Failed to store data in the database' });
      } else {
        res.status(201).json({ message: 'Data stored successfully' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});


// Import necessary modules and setup your Express app

// Define the endpoint to retrieve user data
app.get('/api/equitRequest/:userId', (req, res) => {
  try {
    const userId = req.params.userId; // Extract the user ID from the URL parameter

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Query the database to get the data for the specified user
    entriesRef.orderByChild('userId').equalTo(userId).once('value', (snapshot) => {
      if (snapshot.exists()) {
        // Convert the snapshot into an array of user entries
        const userEntries = [];
        snapshot.forEach((childSnapshot) => {
          const entry = childSnapshot.val();
          userEntries.push(entry);
        });

        res.status(200).json({ userData: equitRequest });
      } else {
        res.status(404).json({ error: 'User data not found' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user data' });
  }
});

app.get('/api/loanRequest/:userId', (req, res) => {
  try {
    const userId = req.params.userId; // Extract the user ID from the URL parameter

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Query the database to get the data for the specified user
    entriesRef.orderByChild('userId').equalTo(userId).once('value', (snapshot) => {
      if (snapshot.exists()) {
        // Convert the snapshot into an array of user entries
        const userEntries = [];
        snapshot.forEach((childSnapshot) => {
          const entry = childSnapshot.val();
          userEntries.push(entry);
        });

        res.status(200).json({ userData: loanRequest });
      } else {
        res.status(404).json({ error: 'User data not found' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user data' });
  }
});


// Import necessary modules and setup your Express app

// Define the endpoint to store user subscription data
app.post('/store-subscription', (req, res) => {
  // Assuming the user is already authenticated and you have obtained their UID
 
  const userId = req.params.userId;

  const { plan, paymentDate, endDate } = req.body;

  // Create a reference to the database path where you want to store the subscription information under the user's data
  const userRef = db.ref(`users/${userId}`);

  // Create a 'subscriptions' node under the user's data and store the subscription information
  const subscriptionsRef = userRef.child('subscriptions');
  subscriptionsRef.push({ plan, paymentDate, endDate }, (error) => {
    if (error) {
      res.status(500).send('Error storing subscription information');
    } else {
      res.status(200).send('Subscription information stored successfully');
    }
  });
});

app.get('/check-subscription-status', (req, res) => {
  // Assuming the user is already authenticated and you have obtained their UID
  
  const userId = req.params.userId;

  // Create a reference to the user's subscription data
  const userRef = db.ref(`users/${userId}/subscriptions`);

  // Query the subscription data to check if there is an active plan
  userRef.orderByChild('endDate').endAt(new Date().toISOString()).limitToLast(1).once('value', (snapshot) => {
    const subscription = snapshot.val();
    
    if (subscription) {
      // There is an active subscription
      const subscriptionId = Object.keys(subscription)[0];
      const { plan, endDate } = subscription[subscriptionId];
      
      res.status(200).json({
        active: true,
        plan,
        endDate,
      });
    } else {
      // There is no active subscription
      res.status(200).json({
        active: false,
        plan: null,
        endDate: null,
      });
    }
  });
});


app.put('/updateMilestone/:userId/:milestoneId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const milestoneId = parseInt(req.params.milestoneId);
  const { milestoneDescription, milestoneDate } = req.body;

  // Find the milestone to update
  const milestoneToUpdate = milestones.find(m => m.id === milestoneId && m.userId === userId);

  if (!milestoneToUpdate) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  // Update milestone properties
  if (milestoneDescription) {
    milestoneToUpdate.description = milestoneDescription;
  }
  if (milestoneDate) {
    milestoneToUpdate.date = milestoneDate;
  }

  return res.status(200).json({ message: 'Milestone updated successfully', milestone: milestoneToUpdate });
});

// Delete Milestone
app.delete('/deleteMilestone/:userId/:milestoneId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const milestoneId = parseInt(req.params.milestoneId);

  // Find the milestone to delete
  const milestoneIndex = milestones.findIndex(m => m.id === milestoneId && m.userId === userId);

  if (milestoneIndex === -1) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const deletedMilestone = milestones.splice(milestoneIndex, 1)[0];

  return res.status(200).json({ message: 'Milestone deleted successfully', milestone: deletedMilestone });
});

app.put('/api/updateTeammate/:userId/:teammateId', upload.single('image'), (req, res) => {
  const userId = req.params.userId;
  const teammateId = req.params.teammateId;
  const { name, role } = req.body;

  // Check if name and role are provided (compulsory fields)
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are compulsory fields.' });
  }

  // Get the existing teammate data
  teammatesRef.child(`${userId}/Teammate`).child(teammateId).once('value', (snapshot) => {
    const existingTeammate = snapshot.val();

    if (!existingTeammate) {
      return res.status(404).json({ error: 'Teammate not found.' });
    }

    // Generate a unique filename for the updated image (e.g., using a timestamp)
    const timestamp = Date.now();
    const imageName = `${timestamp}_${req.file.originalname}`;

    // Create a new teammate object with the updated data
    const updatedTeammate = {
      name,
      role,
      imageURL: existingTeammate.imageURL, // Preserve the existing imageURL if no new image is provided
    };

    // If a new image is provided, store it in Firebase Storage and update the download URL
    if (req.file) {
      const bucket = admin.storage().bucket();

      const imageBuffer = req.file.buffer;

      const file = bucket.file(imageName);

      const blobStream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      blobStream.on('error', (error) => {
        return res.status(500).json({ error: 'Error uploading the image.' });
      });

      blobStream.on('finish', () => {
        // Get the download URL for the updated image
        file.getSignedUrl({ action: 'read', expires: '01-01-2030' }, (error, downloadUrl) => {
          if (error) {
            return res.status(500).json({ error: 'Error getting download URL.' });
          }

          updatedTeammate.imageURL = downloadUrl;

          // Update the teammate data in the database
          teammatesRef.child(userId).child(teammateId).update(updatedTeammate, (error) => {
            if (error) {
              return res.status(500).json({ error: 'Error updating teammate data.' });
            }

            return res.status(200).json({ message: 'Teammate updated successfully.' });
          });
        });
      });

      blobStream.end(imageBuffer);
    } else {
      // If no new image is provided, update the teammate data without changing the imageURL
      teammatesRef.child(userId).child(teammateId).update(updatedTeammate, (error) => {
        if (error) {
          return res.status(500).json({ error: 'Error updating teammate data.' });
        }

        return res.status(200).json({ message: 'Teammate updated successfully.' });
      });
    }
  });
});

app.delete('/api/deleteTeammate/:userId/:teammateId', (req, res) => {
  const userId = req.params.userId;
  const teammateId = req.params.teammateId;

  // Check if the teammate exists
  teammatesRef.child(`${userId}/Teammate`).child(teammateId).once('value', (snapshot) => {
    const existingTeammate = snapshot.val();

    if (!existingTeammate) {
      return res.status(404).json({ error: 'Teammate not found.' });
    }

    // Delete the teammate data from the database
    teammatesRef.child(userId).child(teammateId).remove((error) => {
      if (error) {
        return res.status(500).json({ error: 'Error deleting teammate data.' });
      }

      return res.status(200).json({ message: 'Teammate deleted successfully.' });
    });
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



  