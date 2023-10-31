const admin = require('firebase-admin');
const express = require('express');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Firebase Admin SDK and set up your Firebase Realtime Database
admin.initializeApp();
const db = admin.database();
const dataRef = db.ref('your-data-reference');

const app = express();

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
          // Update user data in Firebase database with the image URL
          const businessData = {
            businessName,
            companyVision,
            registrationStatus,
            businessType,
            businessRCNumber,
            yearOfIncorporation,
            businessSector,
            logoUrl: imageUrl,
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
    // Handle the case where req.file is not defined.
    res.status(400).json({ error: 'No image file provided.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
