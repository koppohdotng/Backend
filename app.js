// import * as Sentry from "@sentry/node";
// import { ProfilingIntegration } from "@sentry/profiling-node";
const express = require('express');
const app = express();
const cors = require('cors');
const admin = require('firebase-admin');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./admin/adminRoutes');
const investorRoutes = require('./investorRoutes/investorRoutes');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
var postmark = require("postmark");
//const axios = require('axios');
app.use(express.static(__dirname));
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");
const fs = require('fs');


const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');


Sentry.init({
  dsn: "https://fcdfd51065d11d6a93d2a82b8d323961@o4506625417216000.ingest.sentry.io/4506626630615040",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.get("/", function rootHandler(req, res) {
  res.end("Hello world!");
});

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});








// const http = require('http');

// const socketIO = require('socket.io');

// const server = http.createServer(app);
// const io = socketIO(server);

// app.use(express.static('public'));

// io.on('connection', (socket) => {
//   console.log('A user connected');

//   // Listen for new chat messages and broadcast to all clients
//   socket.on('newChat', ({ userId, fundingRequestId, newChat, sourceChat }) => {
//     try {
//       const chatRef = `/users/${userId}/fundingRequest/${fundingRequestId}/chats`;

//       const newMessage = {
//         message: newChat,
//         source: sourceChat,
//         timestamp: new Date(),
//       };

//       // Broadcast the new chat message to all connected clients in the same room
//       io.to(fundingRequestId).emit('newChat', {
//         fundingRequestId,
//         chatId: socket.id, // You can use socket.id as a unique identifier for the message
//         message: newMessage,
//       });
//     } catch (error) {
//       console.error('Error storing chat:', error);
//     }
//   });

//   // Join a room based on fundingRequestId
//   socket.on('joinRoom', (fundingRequestId) => {
//     socket.join(fundingRequestId);
//   });

//   // Listen for disconnect event
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });


app.use(cors());


app.use(bodyParser.json());

// Define a route
app.get('/', (req, res) => {
  res.send('Welcome to Koppoh');
   

});

app.get('/a', (req, res) => {
  res.send('Welcome to Koppoh, Express yourself!');
   
 
// client.sendEmail({
//   "From": "info@koppoh.com",
//   "To": "mayowaadeojo@gmail.com",
//   "Subject": "Hello from Postmark",
//   "HtmlBody": "<strong>Hello</strong> Sir Salary increase sir for your boy.",
//   "TextBody": "Hello from Postmark!",
//   "MessageStream": "outbound"
// });

client.sendEmailWithTemplate({
  From: 'info@koppoh.com',
  To: 'lhawhaltimi@gmail.com',
  TemplateId: '33232370',
  TemplateModel: {
    firstName:'LAWAL Oluwatimileyin',
    verifyNumber: '1223333',
  },
})
.then((response) => {
  console.log('Email sent successfully:', response);
  res.status(201).json({ message: 'Signup successful', user: userData });
})
.catch((error) => {
  console.error('Email sending error:', error);
  res.status(500).json({ error: 'Email sending error' });
});


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

app.use('/adminRoutes', adminRoutes);

app.use('/investorRoutes',investorRoutes);



app.put('/api/update-user/:uid', (req, res) => {
  const userId = req.params.uid; // Get the user's UID from the URL
  const { firstName, lastName, country, phoneNumber, role, linkedIn } = req.body;

  // Check if the provided data is available for update
  const updatedUserData = {};

  if (firstName) {
    updatedUserData.firstName = firstName;
  }
  if (lastName) {
    updatedUserData.lastName = lastName;
  }
  if (country) {
    updatedUserData.country = country;
  }
  if (phoneNumber) {
    updatedUserData.phoneNumber = phoneNumber;
  }
  if (role) {
    updatedUserData.role = role;
  }
  if (linkedIn) {
    updatedUserData.linkedIn = linkedIn;
  }

  // Update the user's data in the Firebase Realtime Database
  const db = admin.database();
  const usersRef = db.ref('users');

  usersRef
    .child(userId)
    .update(updatedUserData)
    .then(() => {
      // Calculate profile completeness
      let count = 0;

      if (updatedUserData.firstName) count++;
      if (updatedUserData.lastName) count++;
      if (updatedUserData.country) count++;
      if (updatedUserData.phoneNumber) count++;
      if (updatedUserData.role) count++;
      if (updatedUserData.linkedIn) count++;

      const profileCompleteness = (count / 6) * 100;

      // Update profile completeness in the database
      usersRef.child(userId).update({ profileCompleteness : profileCompleteness});

      res.status(200).json({ message: 'User information updated successfully', profileCompleteness });
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
app.post('/loanRequest/:userId', upload.fields([
  { name: 'businessPlanFile', maxCount: 1 },
  { name: 'bankStatementFile', maxCount: 1 },
  { name: 'cashFlowAnalysisFile', maxCount: 1 },
  { name: 'financialFile', maxCount: 1 },
]), (req, res) => {
  const userId = req.params.userId;
  const {
    date,
    problem,
    solution,
    stage,
    currency,
    fundingAmount,
    reviewstage,
    businessModel,                                                                                                                                                                                                                                                                                                                                                  
    useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
    financials,
  } = req.body;

  const otherValue = other !== undefined ? other : '';
  // Handle file uploads
  const files = req.files;
  const uploadPromises = [];
  const fileUrls = {};
  console.log("odebe")
  if (files) {

    console.log("odebe 1")
    Object.keys(files).forEach((key) => {
      const file = files[key][0];
      const fileName = `${key}_${userId}_${Date.now()}a.jpg`; // Change the naming convention as needed
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      const uploadPromise = new Promise((resolve, reject) => {
        stream.on('finish', () => {
          fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' })
            .then(downloadUrls => {
              fileUrls[key] = downloadUrls[0];
              resolve();
            })
            .catch(error => {
              console.error(`Error generating download URL for ${key} file:`, error);
              reject(`Failed to generate ${key} file URL.`);
            });
        });

        stream.on('error', (err) => {
          console.error(`Error uploading ${key} file:`, err);
          reject(`Failed to upload ${key} file.`);
        });

        stream.end(file.buffer);
      });

      uploadPromises.push(uploadPromise);
    });
  }

  // Wait for all file uploads to complete
  Promise.all(uploadPromises)
    .then(() => {
      console.log("odebe 2")
      // Create a loan request data object with the provided fields and file URLs
      const fundingRequest = {
        date,
        problem,
        solution,
        stage,
        currency,
        fundingAmount,
        reviewstage,
        businessModel , 
        useOfFunds: {
          product,
          saleAndMarketing,
          researchAndDevelopment,
          capitalExpenditure,
          operation,
          other: otherValue,
          
          
        },
       
        fundingType:"Debt" ,
        financials,
        businessPlanFileUrl: fileUrls.businessPlanFile || '',
        bankStatementFileUrl: fileUrls.bankStatementFile || '',
        cashFlowAnalysisFileUrl: fileUrls.cashFlowAnalysisFile || '',
        financialFileUrl: fileUrls.financialFile || '',
      };
      console.log("odebe 4")
      // Update the loan request data
      const newRef = dataRef.child(`${userId}/fundingRequest`).push(fundingRequest, (error) => {
        console.log("odebe 3")
        if (error) {
          console.log("obede 5"+error)
          res.status(500).json({ error: 'Failed to update loan request data.'});
        } else {
          const newKey = newRef.key;

    // Retrieve the saved data using the correct key
    dataRef.child(`${userId}/fundingRequest/${newKey}`).once('value', (snapshot) => {
      const savedData = snapshot.val();
      savedData.fundingRequestId = newKey;
      console.log(savedData);
      res.status(200).json({
        message: 'Loan request data updated successfully.',
        savedData: savedData
       
      });
    });
                
        }
      });
    })
    .catch(error => {
      console.log(error)
      res.status(500).json({ error });
    });
});


app.post('/equityRequest/:userId', upload.fields([
  { name: 'pitchdeck', maxCount: 1 },
  { name: 'valuation', maxCount: 1 },
  { name: 'captable', maxCount: 1 },
  { name: 'financialmodel', maxCount: 1 },
  { name: 'founderagreement', maxCount: 1 },
  { name: 'taxclearance', maxCount: 1 },
]), (req, res) => {
  const userId = req.params.userId;
  const {
    date,
    problem,
    solution,
    stage,
    investmentStage,
    currency,
    fundingAmount,
    businessModel,
    reviewstage,
    useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
    financials,
  } = req.body;
  const otherValue = other !== undefined ? other : '';

  // Handle file uploads
  const files = req.files;
  const uploadPromises = [];
  const fileUrls = {};

  if (files) {
    Object.keys(files).forEach((key) => {
      const file = files[key][0];
      const fileName = `${key}_${userId}_${Date.now()}a.jpg`; // Change the naming convention as needed
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      const uploadPromise = new Promise((resolve, reject) => {
        stream.on('finish', () => {
          fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' })
            .then(downloadUrls => {
              fileUrls[key] = downloadUrls[0];
              resolve();
            })
            .catch(error => {
              console.error(`Error generating download URL for ${key} file:`, error);
              reject(`Failed to generate ${key} file URL.`);
            });
        });

        stream.on('error', (err) => {
          console.error(`Error uploading ${key} file:`, err);
          reject(`Failed to upload ${key} file.`);
        });

        stream.end(file.buffer);
      });

      uploadPromises.push(uploadPromise);
    });
  }

  // Wait for all file uploads to complete
  Promise.all(uploadPromises)
    .then(() => {
      // Create an equity request data object with the provided fields and file URLs
      const fundingRequest = {
        date,
        problem,
        solution,
        stage,
        investmentStage,
        currency,
        fundingAmount,
        reviewstage,
        businessModel,
        useOfFunds: {
          product,
          saleAndMarketing,
          researchAndDevelopment,
          capitalExpenditure,
          operation,
          other: otherValue,
        },
        financials,
        
       
        fundingType: "Equity" ,
        pitchdeckUrl: fileUrls.pitchdeck || '',
        valuationUrl: fileUrls.valuation || '',
        captableUrl: fileUrls.captable || '',
        financialmodelUrl: fileUrls.financialmodel || '',
        founderagreementUrl: fileUrls.founderagreement || '',
        taxclearanceUrl: fileUrls.taxclearance || '',
      };
     
      // Update the equity request data
      const newRef =  dataRef.child(`${userId}/fundingRequest`).push(fundingRequest, (error) => {
        if (error) {
          console.log(error)
          res.status(500).json({ error: 'Failed to update equity request data.'});
        } else {

          const newKey = newRef.key;

    // Retrieve the saved data using the correct key
    dataRef.child(`${userId}/fundingRequest/${newKey}`).once('value', (snapshot) => {
      const savedData = snapshot.val();
       
      savedData.fundingRequestId = newKey;

      console.log(savedData);
      res.status(200).json({
        message: 'Equity request data updated successfully.',
        savedData: savedData
      });
    });
          
        }
      });
    })
    .catch(error => {
      console.log(error)
      res.status(500).json({ error });
    });
});

app.post('/storeChat/:userId/:fundingRequestId', (req, res) => {
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;
  const { sender, message, timestamp } = req.body;

  // Ensure required fields are provided
  if (!userId || !fundingRequestId || !sender || !message || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Create a chat message object
  const chatMessage = {
    sender,
    message,
    timestamp,
  };

  // Update the chat messages under the specified funding request
  const chatRef = dataRef.child(`${userId}/fundingRequest/${fundingRequestId}/chats`);
  const newChatRef = chatRef.push(chatMessage, (error) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Failed to store chat message.' });
    } else {
      const newKey = newChatRef.key;

      // Retrieve the saved chat message using the correct key
      chatRef.child(newKey).once('value', (snapshot) => {
        const savedChatMessage = snapshot.val();

        savedChatMessage.chatMessageId = newKey;

        console.log(savedChatMessage);
        return res.status(200).json({
          message: 'Chat message stored successfully.',
          savedChatMessage: savedChatMessage,
        });
      });
    }
  });
});

app.get('/getChat/:userId/:fundingRequestId', (req, res) => {
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;

  // Ensure required fields are provided
  if (!userId || !fundingRequestId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Retrieve all chat messages under the specified funding request
  const chatRef = dataRef.child(`${userId}/fundingRequest/${fundingRequestId}/chats`);
  chatRef.once('value', (snapshot) => {
    const chatMessages = snapshot.val();

    if (!chatMessages) {
      return res.status(404).json({ error: 'No chat messages found for the specified funding request.' });
    }

    // Convert chat messages object to an array
    const chatArray = Object.keys(chatMessages).map((key) => {
      const chatMessage = chatMessages[key];
      chatMessage.chatMessageId = key;
      return chatMessage;
    });

    console.log(chatArray);
    return res.status(200).json({
      message: 'Chat messages retrieved successfully.',
      chatMessages: chatArray,
    });
  });
});


app.put('/updateFundingRequest/:userId/:fundingRequestId', upload.fields([
  { name: 'businessPlanFile', maxCount: 1 },
  { name: 'bankStatementFile', maxCount: 1 },
  { name: 'cashFlowAnalysisFile', maxCount: 1 },
  { name: 'financialFile', maxCount: 1 },
  { name: 'pitchdeck', maxCount: 1 },
  { name: 'valuation', maxCount: 1 },
  { name: 'captable', maxCount: 1 },
  { name: 'financialmodel', maxCount: 1 },
  { name: 'founderagreement', maxCount: 1 },
  { name: 'taxclearance', maxCount: 1 },
]), (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;
 
  // Extract updated information from the request body
  const {
    date,
    problem,
    solution,
    stage,
    currency,
    fundingAmount,
    businessModel,
    reviewstage,
    useOfFunds: { product, saleAndMarketing, researchAndDevelopment, capitalExpenditure, operation, other },
    financials,
  } = req.body;

  // Handle file updates
  const files = req.files;
  console.log('Uploaded Files:', files); // Log uploaded files
  const uploadPromises = [];
  const fileUrls = {};

  if (files) {
    Object.keys(files).forEach((key) => {
      const file = files[key][0];
      const fileName = `${key}_${userId}_${Date.now()}${path.extname(file.originalname)}`; // Change the naming convention as needed
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      const uploadPromise = new Promise((resolve, reject) => {
        stream.on('finish', () => {
          fileRef.getSignedUrl({ action: 'read', expires: '03-01-2500' })
            .then(downloadUrls => {
              fileUrls[key] = downloadUrls[0];
              console.log(`File ${fileName} uploaded successfully.`);
              resolve();
            })
            .catch(error => {
              console.error(`Error generating download URL for ${fileName}:`, error);
              reject(`Failed to generate download URL for ${fileName}.`);
            });
        });

        stream.on('error', (err) => {
          console.error(`Error uploading ${fileName}:`, err);
          reject(`Failed to upload ${fileName}.`);
        });

        stream.end(file.buffer);
      });

      uploadPromises.push(uploadPromise);
    });
  }

  // Wait for all file uploads to complete
  Promise.all(uploadPromises)
    .then(() => {
      // Create an updated funding request object with the provided fields and file URLs
      const updatedFundingRequest = {
        ...(date && { date }),
        ...(problem && { problem }),
        ...(solution && { solution }),
        ...(stage && { stage }),
        ...(currency && { currency }),
        ...(fundingAmount && { fundingAmount }),
        ...(businessModel && { businessModel }), 
        ...(reviewstage && { reviewstage }),
        useOfFunds: {
          ...(product && { product }),
          ...(saleAndMarketing && { saleAndMarketing }),
          ...(researchAndDevelopment && { researchAndDevelopment }),
          ...(capitalExpenditure && { capitalExpenditure }),
          ...(operation && { operation }),
          ...(other && { other }),
        },
        ...(financials && { financials }),
        businessPlanFileUrl: fileUrls.businessPlanFile || '',
        bankStatementFileUrl: fileUrls.bankStatementFile || '',
        cashFlowAnalysisFileUrl: fileUrls.cashFlowAnalysisFile || '',
        financialFileUrl: fileUrls.financialFile || '',
        pitchdeckUrl: fileUrls.pitchdeck || '',
        valuationUrl: fileUrls.valuation || '',
        captableUrl: fileUrls.captable || '',
        financialmodelUrl: fileUrls.financialmodel || '',
        founderagreementUrl: fileUrls.founderagreement || '',
        taxclearanceUrl: fileUrls.taxclearance || '',
      };

      // Update the funding request data
      dataRef.child(`${userId}/fundingRequest/${fundingRequestId}`).update(updatedFundingRequest, (error) => {
        if (error) {
          res.status(500).json({ error: 'Failed to update funding request data.' });
        } else {
          res.status(200).json({ message: 'Funding request data updated successfully.' });
        }
      });
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});


app.post('/successPayment/:userId', (req, res) => {
  const userId = req.params.userId;
  const { paymentType, date, amount, paymentMethod } = req.body;

  // Create a reference to the database
  const db = admin.database();
  const successPaymentsRef = db.ref(`users/${userId}/successPayments`);

  // Save payment data
  const newPaymentRef = successPaymentsRef.push();
  newPaymentRef.set({
    paymentType,
    date,
    amount,
    paymentMethod,
  })
    .then(() => {
      res.status(200).json({ message: 'Success payment data saved successfully.' });
    })
    .catch((error) => {
      console.error('Error saving payment data:', error);
      res.status(500).json({ error: 'Failed to save success payment data.' });
    });
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

const authenticateUser = async (req, res, next) => {
  const idToken = req.header('Authorization');

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Logout endpoint
app.post('/logout/:userId', authenticateUser, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Perform logout operations here (if needed)
    // For example, you might want to invalidate any tokens or update the user's status

    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Define an API route for updating a milestone
app.put('/updateMilestone/:userId/:milestoneId', (req, res) => {
  const userId = req.params.userId;
  const milestoneId = req.params.milestoneId;
  const { milestoneDescription, milestoneDate } = req.body;
  // Create an updated milestone object
  const updatedMilestone = {
    description: milestoneDescription,
    date: milestoneDate,
     // Assuming you're sending the image URL or base64 data
  };

  // Update the milestone in the user's milestones array
  dataRef.child(`${userId}/milestones/${milestoneId}`).update(updatedMilestone, (error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to update the milestone.' });
    } else {
      res.status(200).json({ message: 'Milestone updated successfully.' });
    }
  });
});

// Delete Milestone
app.delete('/deleteMilestone/:userId/:milestoneId', (req, res) => {
  const userId = req.params.userId;
  const milestoneId = req.params.milestoneId;

  // Remove the milestone from the user's milestones array
  dataRef.child(`${userId}/milestones/${milestoneId}`).remove((error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to delete the milestone.' });
    } else {
      res.status(200).json({ message: 'Milestone deleted successfully.' });
    }
  });
});


// API endpoint to update a teammate
app.put('/api/updateTeammate/:userId/:teammateId', upload.single('image'), (req, res) => {
  const userId = req.params.userId;
  const teammateId = req.params.teammateId;
  const { name, role } = req.body;

  // Reference to the specific teammate in the database
  const teammateRef = teammatesRef.child(`${userId}/Teammate/${teammateId}`);

  // Fetch the existing teammate data
  teammateRef.once('value', (snapshot) => {
    const existingTeammate = snapshot.val();

    // Check if the teammate exists
    if (!existingTeammate) {
      return res.status(404).json({ error: 'Teammate not found.' });
    }

    // Generate a unique filename for the image if provided
    let imageName = existingTeammate.imageURL ? existingTeammate.imageURL.split('/').pop() : null;

    if (req.file) {
      const timestamp = Date.now();
      imageName = `${timestamp}_${req.file.originalname}`;
    }

    // Update the teammate object with the new information
    const updatedTeammate = {
      name: name || existingTeammate.name,
      role: role || existingTeammate.role,
      imageURL: existingTeammate.imageURL, // Preserve the existing imageURL if no new image is provided
    };

    // If an image is provided, update it in Firebase Storage and update its download URL in the teammate object
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

          // Update the teammate in the database
          teammateRef.update(updatedTeammate, (error) => {
            if (error) {
              return res.status(500).json({ error: 'Error updating teammate in the database.' });
            }

            return res.status(200).json({ message: 'Teammate updated successfully.' });
          });
        });
      });

      blobStream.end(imageBuffer);
    } else {
      // If no new image is provided, update the teammate object in the database directly
      teammateRef.update(updatedTeammate, (error) => {
        if (error) {
          return res.status(500).json({ error: 'Error updating teammate in the database.' });
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
  teammatesRef.child(`${userId}/Teammate`).child(teammateId).once('value')
    .then(snapshot => {
      const existingTeammate = snapshot.val();

      if (!existingTeammate) {
        return res.status(404).json({ error: 'Teammate not found.' });
      }

      // Delete the teammate data from the database
      return teammatesRef.child(`${userId}/Teammate`).child(teammateId).remove();
    })
    .then(() => {
      return res.status(200).json({ message: 'Teammate deleted successfully.' });
    })
    .catch(error => {
      console.error(error);
      return res.status(500).json({ error: 'Error deleting teammate data.' });
    });
});

const receiptsRef = db.ref('users'); // Reference to the 'receipts' node in your database

// Initialize Multer for handling file uploads

app.post('/api/uploadReceipt/:userId', (req, res) => {
  const userId = req.params.userId;
  const { date, 
    type, 
    
    businessName,
    companyVision,
    registrationStatus,
    businessSector,
    problem
    ,solution,
    businessStage,
    investmentStage,
    currency,
    fundingAmount,
    useOfFunds,
    financials,
     fundingType } = req.body;

  // Check if date and type are provided (compulsory fields)
  if (!date || !type) {
    return res.status(400).json({ error: 'Date and type are compulsory fields.' });
  }

  // Generate a unique filename for the receipt (e.g., using a timestamp)
  // const timestamp = Date.now();
  // const receiptName = `${timestamp}_${req.file.originalname}`;

  // Create a new receipt object
  const newReceipt = {
    // Datereceipt: date,
    type,
  //  receiptURL: '', 
    businessName,
    companyVision,
    registrationStatus,
    businessSector,
    problem
    ,solution,
    businessStage,
    investmentStage,
    currency,
    fundingAmount,
    useOfFunds,
    financials,
     fundingType 
    
    // Initialize the receiptURL field
  };
  receiptsRef.child(userId).update(newReceipt, (error) => {
    if (error) {
      return res.status(500).json({ error: 'Error adding receipt to the database.' });
    }

    return res.status(200).json({ message: 'Receipt added successfully.' });
  });

  // If a receipt is provided, store it in Firebase Storage and add its download URL to the receipt object
  // if (req.file) {
  //   const bucket = admin.storage().bucket();

  //   const receiptBuffer = req.file.buffer;

  //   const file = bucket.file(receiptName); // Use the generated filename

  //   const blobStream = file.createWriteStream({
  //     metadata: {
  //       contentType: req.file.mimetype,
  //     },
  //   });

  //   blobStream.on('error', (error) => {
  //     return res.status(500).json({ error: 'Error uploading the receipt.' });
  //   });

  //   blobStream.on('finish', () => {
  //     // Get the download URL for the uploaded receipt
  //     file.getSignedUrl({ action: 'read', expires: '01-01-2030' }, (error, downloadUrl) => {
  //       if (error) {
  //         return res.status(500).json({ error: 'Error getting download URL.' });
  //       }

  //       newReceipt.receiptURL = downloadUrl;

  //       // Add the new receipt to the database under the specified user ID
        
  //     });
  //   });

  //   blobStream.end(receiptBuffer);
  // } else {
  //   // If no receipt is provided, return an error
  //   return res.status(400).json({ error: 'Receipt file is required.' });
  // }
});

const storagex = admin.storage();

app.get('/storeTeaser-pdf', async (req, res) => {

  const { userId, fundingRequestId, url } = req.query;

  if (!userId || !url) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const pdfBuffer = await page.pdf();
    await browser.close();

    const randomNumber = Math.floor(100000 + Math.random() * 900000);
      console.log(randomNumber);


    const fileName = `${userId}${randomNumber}.pdf`; // Use 'teaser' if fundingRequestId is not provided

    // Upload the PDF directly from memory to Firebase Storage
    const bucket = storagex.bucket();
    const file = bucket.file(`pdfs/${fileName}`);
    await file.save(pdfBuffer, {
      metadata: { contentType: 'application/pdf' },
    });

    // Get the signed URL for the uploaded PDF
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Replace with an appropriate expiration date
    });

    // Update the teaser data in the Realtime Database
    const ref = db.ref(`/users/${userId}/teaser`);

    const teaserData = {
      pdfUrl: signedUrl,
      storageDate: new Date().toISOString(),
    };

    if (fundingRequestId) {
      teaserData.fundingRequestId = fundingRequestId;
    }

    await ref.push(teaserData);

    res.status(200).json({ success: true, pdfUrl: signedUrl, teaserData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', error });
  }
});




app.delete('/deleteFundingRequest/:userId/:fundingRequestId', (req, res) => {
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;

  // Delete the funding request
  dataRef.child(`${userId}/fundingRequest/${fundingRequestId}`).remove((error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to delete funding request.' });
    } else {
      res.status(200).json({ message: 'Funding request deleted successfully.' });
    }
  });
});

app.get('/api/latestBlogPost/:number', async (req, res) => {
  const { number } = req.params;

  try {
    const database = admin.database();
    const snapshot = await database.ref('blogPosts').orderByKey().limitToLast(Number(number)).once('value');
    const blogPosts = snapshot.val();

    // Extract the latest blog post with BlogPostId
    const latestBlogPostKeys = Object.keys(blogPosts);
    const latestBlogPosts = latestBlogPostKeys.map(key => ({
      BlogPostId: key,
      ...blogPosts[key]
    }));

    res.json({ latestBlogPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/blogPost/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const database = admin.database();
    const snapshot = await database.ref('blogPosts').child(postId).once('value');
    const blogPost = snapshot.val();

    if (blogPost) {
      res.json({ blogPost });
    } else {
      res.status(404).json({ error: 'Blog post not found' });
    }
  } catch (error) {
    console.error('Error fetching blog post:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/requestTemplate/:userId', (req, res) => {
  const userId = req.params.userId;
  const { email, phone, message } = req.body;

  // Create a new request template object
  const newRequest = {
    email,
    phone,
    message,
  };
   
  client.sendEmailWithTemplate({
    From: 'info@koppoh.com',
    To: "info@koppoh.com",
    TemplateId: '34496413',
    TemplateModel: {
      email : "info@koppoh.com",
    phone,
    message,
    },
  })



  // Push the new request template to the user's requests array
  dataRef.child(`${userId}/requests`).push(newRequest, (error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to add a new request template.' });
    } else {
      res.status(200).json({ message: 'New request template added successfully.' });
    }
  });
});

app.post('/addEmail', (req, res) => {  
  const { email } = req.body;
  var emailsRef = admin.database().ref("emails");
  // Create a new request template object
  const newEmail = {
    email,
  };
  // Push the new request template to the user's requests array
  emailsRef.push(newEmail, (error) => { 
  
    if (error) {
      res.status(500).json({ error: 'Failed to add a new email.' });
    } else {
      res.status(200).json({ message: 'New email added successfully.' });
    }
  });
});



app.get('/getAllChats/:userId', (req, res) => {
  const userId = req.params.userId;

  // Ensure userId is provided
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter.' });
  }

  // Retrieve all funding requests under the specified user
  const fundingRequestsRef = dataRef.child(`${userId}/fundingRequest`);
  fundingRequestsRef.once('value', (fundingRequestsSnapshot) => {
    const allChats = [];

    // Iterate through each funding request
    fundingRequestsSnapshot.forEach((fundingRequestSnapshot) => {
      const fundingRequestId = fundingRequestSnapshot.key;
      const chatRef = fundingRequestSnapshot.child('chat');

      // Iterate through each chat message under the funding request
      chatRef.forEach((chatMessageSnapshot) => {
        const chatMessageId = chatMessageSnapshot.key;
        const chatMessage = chatMessageSnapshot.val();

        // Include additional information
        chatMessage.fundingRequestId = fundingRequestId;
        chatMessage.chatMessageId = chatMessageId;

        // Add the chat message to the array
        allChats.push(chatMessage);
      });
    });

    return res.status(200).json({
      message: 'All chat messages retrieved successfully.',
      allChats: allChats,
    });
  });
});



app.get('/usersByDate', async (req, res) => {
  try {
    const startTime = req.query.startTime; // Set the start time in your preferred format
    const endTime = req.query.endTime;     // Set the end time in your preferred format

    // Reference to the "users" node in the Realtime Database
    const usersRef = db.ref('users');

    // Query users based on timestamp field
    usersRef.orderByChild('timestamp')
      .startAt(startTime)
      .endAt(endTime)
      .once('value')
      .then(snapshot => {
        const users = [];

        snapshot.forEach(childSnapshot => {
          users.push(childSnapshot.val());
        });

        res.json(users);
      })
      .catch(error => {
        console.error('Error retrieving users:', error);
        res.status(500).send('Internal Server Error');
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/userss', async (req, res) => {
  try {
    const pageSize = 15;
    let page = req.query.page ? parseInt(req.query.page) : 1;

    const snapshot = await usersRef.orderByChild('Date').limitToLast(pageSize * page).once('value');
    const users = snapshot.val();

    const paginatedUsers = Object.values(users).slice(0, pageSize * page);

    res.json(paginatedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users/pages', async (req, res) => {
  try {
    const pageSize = 15;

    const snapshot = await usersRef.once('value');
    const totalUsers = snapshot.numChildren();
    const totalPages = Math.ceil(totalUsers / pageSize);

    res.json({ totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const port = process.env.PORT || 3000;
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// end
  