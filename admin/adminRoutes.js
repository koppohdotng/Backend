const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Firebase Admin SDK with your service account key

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");




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

          function generateRandomNumber() {
            return Math.floor(Math.random() * 900000) + 100000;
          }
          // Generate a random value
          const randomNow = generateRandomNumber();
  
          // Save the random value under superAdmin
          await adminRef.update({ randomNow: randomNow });
          client.sendEmailWithTemplate({
            From: 'info@koppoh.com',
            To: email,
            TemplateId: '33232370',
            TemplateModel: {
              firstName : 'Koppoh',
              verifyNumber: randomNow,
            },
          })
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