const express = require('express');
const app = express();
const admin = require('firebase-admin');
const authRoutes = require('./routes/auth');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
// const verifyGoogleIdToken = require('./google-signin');




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

function generateUniqueFileName(originalName) {
  const fileExtension = path.extname(originalName);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + fileExtension;
}

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
    const businessPlanFile = req.files['businessPlan'][0];
    const bankStatementFile = req.files['bankStatement'][0];
    const cashFlowAnalysisFile = req.files['cashFlowAnalysis'][0];
    const financialFile = req.files['financial'][0];

    // Reference to the database
    const db = admin.database();
    const entriesRef = db.ref('entries');

    // Push the new entry to the database
    const newEntryRef = entriesRef.push();
    const entryId = newEntryRef.key;

    // Store file URLs in the database
    const fileUrls = {
      businessPlan: `https://your-firebase-storage-url.com/${entryId}/businessPlan.pdf`,
      bankStatement: `https://your-firebase-storage-url.com/${entryId}/bankStatement.pdf`,
      cashFlowAnalysis: `https://your-firebase-storage-url.com/${entryId}/cashFlowAnalysis.pdf`,
      financial: `https://your-firebase-storage-url.com/${entryId}/financial.pdf`,
    };

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

    newEntryRef.set(entryData, (error) => {
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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



  