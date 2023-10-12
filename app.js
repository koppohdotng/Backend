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
const teammatesRef = db.ref('teammates'); // Reference to the 'teammates' node in your database

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
        teammatesRef.child(userId).push(newTeammate, (error) => {
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


const dataRef = db.ref('businessInfo'); // Change to your database reference



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

  // Handle image upload and rename
  let logoFileName = '';
  if (req.file) {
    logoFileName = `logo_${userId}_${Date.now()}.jpg`; // Change the naming convention as needed
    const bucket = admin.storage().bucket();
    const file = bucket.file(logoFileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });
    stream.end(req.file.buffer);
  }

  // Update user data in Firebase database
  const userData = {
    businessName,
    companyVision,
    registrationStatus,
    businessType,
    businessRCNumber,
    yearOfIncorporation,
    businessSector,
    logoFileName,
  };

  dataRef.child(userId).update(userData, (error) => {
    if (error) {
      res.status(500).json({ error: 'Failed to update user data.' });
    } else {
      res.status(200).json({ message: 'User data updated successfully.' });
    }
  });
});

const dataRefz = db.ref('addMilestone'); // Change to your database reference

//Define an API route for adding a new milestone
app.post('/addMilestone/:userId', (req, res) => {
  const userId = req.params.userId;
  const { milestoneName, milestoneDescription, milestoneDate } = req.body;

  // Create a new milestone object
  const newMilestone = {
    name: milestoneName,
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
app.post('/api/subscription', (req, res) => {
  try {
    const { userId, subscriptionType } = req.body;

    // Validate the request data
    if (!userId || !subscriptionType) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Calculate subscription start and expiration dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Add 30 days

    // Reference to the database
    const db = admin.database();
    const subscriptionsRef = db.ref('subscriptions');

    // Push the new subscription data to the database
    const newSubscriptionRef = subscriptionsRef.push();
    const subscriptionId = newSubscriptionRef.key;

    const subscriptionData = {
      userId,
      subscriptionType,
      subscriptionStartDate: subscriptionStartDate.toISOString(),
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    };

    newSubscriptionRef.set(subscriptionData, (error) => {
      if (error) {
        res.status(500).json({ error: 'Failed to store subscription data in the database' });
      } else {
        res.status(201).json({ message: 'Subscription data stored successfully' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



  