// ... (Your existing code for creating the user and storing data in Firebase)

// Send the welcome email using Postmark
const welcomeEmailTemplateId = 33232370; // Replace with your Postmark template ID

// postmarkClient
//   .sendEmailWithTemplate({
//     From: 'your@email.com',
//     To: email, // User's email address
//     TemplateId: welcomeEmailTemplateId,
//     TemplateModel: {
//       firstName: firstName, // Pass any data you want to use in the email template
//       // Add more template variables if needed
//     },
//   })
//   .then((response) => {
//     console.log('Welcome email sent:', response);
//     // Respond to the client indicating successful signup
//     res.status(201).json({ message: 'Signup successful', user: userData });
//   })
//   .catch((error) => {
//     console.error('Error sending welcome email:', error);
//     // Even if the email fails to send, you may still want to respond with a successful signup
//     res.status(201).json({ message: 'Signup successful', user: userData });
//   });


const dataRef = db.ref('businessInfo'); // Change to your database reference

// Define an API route for updating user data
app.put('/updateUserData/:userId', multer.single('logo'), (req, res) => {
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

// // Initialize Firebase Realtime Database
// const db = admin.database();
// const teammatesRef = db.ref('teammates'); // Reference to the 'teammates' node in your database

// // Initialize Multer for handling image uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // API endpoint to add a new teammate
// app.post('/api/addTeammate/:userId', upload.single('image'), (req, res) => {
//   const userId = req.params.userId;
//   const { name, role } = req.body;

//   // Check if name and role are provided (compulsory fields)
//   if (!name || !role) {
//     return res.status(400).json({ error: 'Name and role are compulsory fields.' });
//   }

//   // Generate a unique filename for the image (e.g., using a timestamp)
//   const timestamp = Date.now();
//   const imageName = `${timestamp}_${req.file.originalname}`;

//   // Create a new teammate object
//   const newTeammate = {
//     name,
//     role,
//     imageURL: '', // Initialize the imageURL field
//   };

//   // If an image is provided, store it in Firebase Storage and add its download URL to the teammate object
//   if (req.file) {
//     const bucket = admin.storage().bucket();

//     const imageBuffer = req.file.buffer;

//     const file = bucket.file(imageName); // Use the generated filename

//     const blobStream = file.createWriteStream({
//       metadata: {
//         contentType: req.file.mimetype,
//       },
//     });

//     blobStream.on('error', (error) => {
//       return res.status(500).json({ error: 'Error uploading the image.' });
//     });

//     blobStream.on('finish', () => {
//       // Get the download URL for the uploaded image
//       file.getSignedUrl({ action: 'read', expires: '01-01-2030' }, (error, downloadUrl) => {
//         if (error) {
//           return res.status(500).json({ error: 'Error getting download URL.' });
//         }

//         newTeammate.imageURL = downloadUrl;

//         // Add the new teammate to the database under the specified user ID
//         teammatesRef.child(userId).push(newTeammate, (error) => {
//           if (error) {
//             return res.status(500).json({ error: 'Error adding teammate to the database.' });
//           }

//           return res.status(200).json({ message: 'Teammate added successfully.' });
//         });
//       });
//     });

//     blobStream.end(imageBuffer);
//   } else {
//     // If no image is provided, add the teammate object to the database directly
//     teammatesRef.child(userId).push(newTeammate, (error) => {
//       if (error) {
//         return res.status(500).json({ error: 'Error adding teammate to the database.' });
//       }

//       return res.status(200).json({ message: 'Teammate added successfully.' });
//     });
//   }
// });


