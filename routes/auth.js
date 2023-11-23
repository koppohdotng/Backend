const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('118360199442016913320');
const { ServerClient } = require('postmark');

const postmarkClient = new ServerClient('61211298-3714-4551-99b0-1164f8a9cb33');




// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('../serviceAccountKey.json'); // Adjust the path as needed
const { error } = require('console');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://koppoh-4e5fb-default-rtdb.firebaseio.com',
  storageBucket: 'gs://koppoh-4e5fb.appspot.com',
   // Replace with your Firebase project's Realtime Database URL
});

// Define a route for user signup
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, password, refFrom } = req.body;

  admin
      .auth()
      .getUserByEmail(email)
      .then(() => {
        // If the email already exists, return an error response
        res.status(400).json({ error: 'Email already exists' });
      })
      .catch((getUserError) => {
        if (getUserError.code === 'auth/user-not-found') {
            // const signupDate= new Date();
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
              
              const userData = {
                firstName,
                lastName,
                email,
                uid: userRecord.uid,
                emailVerification,
                firstTime,
                Date: currentDate.toISOString(),
                refFrom,



              };
  
              // Store user data in Firebase Realtime Database (or Firestore)
              const db = admin.database();
              const usersRef = db.ref('users');

              try {
                usersRef.child(userRecord.uid).set(userData, (error) => {
                  if (error) {
                    // Handle database error
                    console.error('Database error:', error);
                    res.status(500).json({ error: 'Database error' },error);
                  } else {
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
              res.status(400).json({ error: 'Signup failed' }), signupError;
            });
        } else {
          // Handle other errors that may occur while checking the email
          console.error('Email check error:', getUserError);
          res.status(500).json({ error: 'Server error' });
        }
      });
});


router.get('/login', (req, res) => {
    res.send('It is working');
  });


  
  // Example usage in an Express.js route
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Authenticate user using email and password
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().signInWithEmailAndPassword(email, password);
  
      res.status(200).json({ message: 'Login successful', uid: userRecord.uid });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  router.get('/google', async (req, res) => {
    const { token } = req.query;
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
      const userId = payload['sub'];
  
      // Check if user already exists in Firebase Authentication
      const userRecord = await admin.auth().getUser(userId);
  
      // If user doesn't exist, create a new Firebase user
      if (!userRecord) {
        const newUser = await admin.auth().createUser({
          uid: userId,
          email: payload.email,
          displayName: payload.name,
          // You can set more user properties here
          firstName: payload.given_name, // Get the first name from Google
          lastName: payload.family_name, // Get the last name from Google
          emailVerification: true,
          firstTime: true,
          currentDate: new Date().toISOString(),
        });
      }
  
      // Generate a Firebase custom token for the user
      const customToken = await admin.auth().createCustomToken(userId);
  
      res.json({ customToken });
    } catch (error) {
      console.error('Error verifying Google ID token:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
  
  const isAuthenticated = (req, res, next) => {
    // Check if the request contains a valid Firebase ID token
    const idToken = req.header('Authorization');
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    // Verify the ID token
    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        // Authentication successful, the decoded token contains user information
        req.user = decodedToken;
        next(); // Continue to the next middleware or route handler
      })
      .catch((error) => {
        // Authentication failed
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Unauthorized' });
      });
  };
  
  // Example API endpoint that requires authentication
  router.get('/api/user', isAuthenticated, (req, res) => {
    // You can access user information from req.user
    const user = req.user;
    res.status(200).json({ message: 'Authentication successful', user });
  })
  
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'info.koppoh@gmail.com', // Replace with your Gmail email
      pass: 'taljmxzjfbvhipje' // Replace with your Gmail password or an app-specific password  taljmxzjfbvhipje

    }
  });
  
  
  // Define the route for sending password reset emails
  router.post('/sendPasswordResetEmail', async (req, res) => {
    const email = req.body.email;
  
    try {
      // Generate a password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);
  
      // Configure email data
      const mailOptions = {
        from: 'info.koppoh@gmail.com', // Sender's email address
        to: email, // Recipient's email address
        subject: 'Password Reset Request',
        text: `Click the following link to reset your password: ${resetLink}` // Body of the email
      };
  
      // Send the email using Nodemailer (as you did before)
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email sending error:', error);
          res.status(400).json({ error: 'Password reset email sending failed' });
        } else {
          console.log('Email sent: ' + info.response);
          res.status(200).json({ message: 'Password reset email sent successfully' });
        }
      });
    } catch (error) {
      console.error('Password reset link generation error:', error);
      res.status(400).json({ error: 'Password reset link generation failed' });
    }
  });
  

  const checkEmailExistence = async (email) => {
    try {
      // Check if the email exists in the database
      const snapshot = await admin
        .database()
        .ref('users')
        .orderByChild('email')
        .equalTo(email)
        .once('value');
  
      if (snapshot.exists()) {
        return { exists: true, message: 'Email already exists' };
      } else {
        return { exists: false, message: 'Email does not exist' };
      }
    } catch (error) {
      console.error('Check email existence error:', error);
      return { exists: false, message: 'Error checking email existence' };
    }
  };
  
  // Example usage in an Express.js route
  router.post('/check-email', async (req, res) => {
    const { email } = req.body;
  
    const emailCheckResult = await checkEmailExistence(email);
  
    if (emailCheckResult.exists) {
      res.status(200).json({ message: emailCheckResult.message });
    } else {
      res.status(404).json({ message: emailCheckResult.message });
    }
  });
  
  
module.exports = router;
