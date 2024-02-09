const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('../serviceAccountKey.json'); // Adjust the path as needed
const { error } = require('console');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://koppoh-4e5fb-default-rtdb.firebaseio.com',
  storageBucket: 'gs://koppoh-4e5fb.appspot.com',
   // Replace with your Firebase project's Realtime Database URL
});

router.post('/admin/login', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Authenticate user with Firebase Authentication
      const user = await admin.auth().getUserByEmail(email);
  
      // Check if the user is an admin in the Realtime Database
      const uid = user.uid;
      const adminRef = admin.database().ref(`/admins/${uid}`);
      const adminData = await adminRef.once('value');
  
      if (adminData.exists() && adminData.val().isAdmin) {
        // User is an admin, allow login
  
        // Check superAdmin value
        const superAdminValue = adminData.val().superAdmin;
  
        if (superAdminValue === 'koppoh') {
          // Generate a random value
          const randomNow = generateRandomNow();
  
          // Save the random value under superAdmin
          await adminRef.update({ superAdmin: randomNow });
  
          res.status(200).json({ message: 'Login successful. Random value generated for superAdmin.' });
        } else {
          // Fetch the admin's data
          res.status(200).json({ message: 'Login successful. Fetching admin data.', adminData: adminData.val() });
        }
      } else {
        // User is not an admin, deny login
        res.status(403).json({ error: 'Unauthorized access' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  module.exports = router;