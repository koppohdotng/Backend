const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client('118360199442016913320');

// var postmark = require("postmark")dd;

require('dotenv').config();

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// const postmarkClient = new ServerClient('612112983714455199b01164f8a9chhb33');
 
var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");



const { error } = require('console');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://koppoh-4e5fb-default-rtdb.firebaseio.com',
  storageBucket: 'gs://koppoh-4e5fb.appspot.com',
   // Replace with your Firebase project's Realtime Database URL
});
// const serviceAccount = require('../staging.json'); // Adjust the path as needed
// const { error } = require('console');
// console.log(error)
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://koppoh-362da-default-rtdb.firebaseio.com',
//   storageBucket: 'gs://koppoh-362da.appspot.com',
//    // Replace with your Firebase project's Realtime Database URL
// });


router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, refFrom } = req.body;

  try {
      // Check if the user already exists
      await admin.auth().getUserByEmail(email);
      // If the user exists, return an error response
      return res.status(400).json({ error: 'Email already exists' });
  } catch (getUserError) {
      if (getUserError.code === 'auth/user-not-found') {
          try {
              // Create a new user in Firebase Authentication
              const userRecord = await admin.auth().createUser({ email, password });
              
              // Generate a verification token
              const verificationToken = Math.floor(Math.random() * 900000) + 100000; // Generate new verification token
              const currentDate = new Date();
              const signupdate = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000);

              // Prepare user data
              const userData = {
                  firstName,
                  lastName,
                  email,
                  uid: userRecord.uid,
                  emailVerification: false,
                  firstTime: true,
                  refFrom,
                  Date: currentDate.toISOString(),
                  signupdate : signupdate,
                  verificationToken: verificationToken  // Add verification token to user data
              };

              // Store user data in Firebase Realtime Database
              const db = admin.database();
              const usersRef = db.ref('users');
              await usersRef.child(userRecord.uid).set(userData);

              // Generate confirmation link
              const confirmationLink = `https://koppoh.ng/confirm-verification?email=${email}&token=${verificationToken}`;

              // Send verification email
              await client.sendEmailWithTemplate({
                  From: 'info@koppoh.com',
                  To: email,
                  TemplateId: '33232370', // Your template ID
                  TemplateModel: {
                      firstName,
                      confirmationLink
                  },
              });

              // Respond with success
              res.status(201).json({ message: 'Signup successful, please check your email to verify your account', user: userData });
          } catch (signupError) {
              // Handle errors related to user creation or database issues
              console.error('Signup error:', signupError);
              res.status(400).json({ error: 'Signup failed' });
          }
      } else {
          // Handle other errors that may occur while checking the email
          console.error('Email check error:', getUserError);
          res.status(500).json({ error: 'Server error' });
      }
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
    return { exists: false, message: 'Error checking email existence', error: error.message };
  }
};

// Example usage in an Express.js route
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  console.log('Checking email:', email);

  try {
    const emailCheckResult = await checkEmailExistence(email);

    if (emailCheckResult.exists) {
      res.status(200).json({ message: emailCheckResult.message });
    } else {
      res.status(404).json({ message: emailCheckResult.message });
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.post('/confirm-email', async (req, res) => {
  const { email, token } = req.query;
  console.log(email,token)

  try {
    // Fetch the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const db = admin.database();
    const usersRef = db.ref('users');
    const userSnapshot = await usersRef.child(userRecord.uid).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      
      console.log('User not found')
      return res.status(400).json({ error: 'User not found' });
     
      
    }
    
      const storeFirstname = userData.firstName;
      const storeemail = userData.email

    // Check if the token matches
    if (userData.verificationToken !== parseInt(token)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Check if the verification is within 30 minutes
    const currentTimeInSeconds = Math.floor(new Date().getTime() / 1000);
    const timeDifference = currentTimeInSeconds - userData.signupdate;

    if (timeDifference > 1800) { // 1800 seconds = 30 minutes
      return res.status(400).json({ error: 'Verification link expired' });
    }

    // Update the user's email verification status
    await usersRef.child(userRecord.uid).update({ emailVerification: true });
    client.sendEmailWithTemplate({
      From: 'info@koppoh.com',
      To: storeemail,
      TemplateId: '34126600',
      TemplateModel: {
        storeFirstname   
      },
    })


    // Respond with success
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/resendVerification', async (req, res) => {
  const { email } = req.body;
  const verificationToken = Math.floor(Math.random() * 900000) + 100000; // Generate new verification token
  admin
      .auth()
      .getUserByEmail(email)
      .then((userRecord) => {
          // If user exists, resend verification email
          
          const confirmationLink = `https://koppoh.ng/confirm-verification?email=${email}&token=${verificationToken}`;
          console.log(confirmationLink)
          var firstName = userRecord.firstName
          
          sendVerificationEmail(email, firstName, confirmationLink);

          // Update verification token in user data
          const db = admin.database();
          const investorsRef = db.ref('users');
          const currentDate = new Date();
          const signupdate = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000);
          console.log(signupdate)
          investorsRef.child(userRecord.uid).update({ verificationToken });

          investorsRef.child(userRecord.uid).update({ signupdate });
           console.log("debe")
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

function sendVerificationEmail(email, firstName, confirmationLink) {
  client.sendEmailWithTemplate({
      From: 'info@koppoh.com',
      To: email,
      TemplateId: '33232370',
      TemplateModel: {
        confirmationLink,
          firstName
      },
  })
  .catch((error) => {
      console.error('Email sending error:', error);
  });
}

router.post('/change-password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  // Authenticate the user with the current email and password
  admin
    .auth()
    .getUserByEmail(email)
    .then((userRecord) => {
      // Sign in the user with the current email and password
      return admin.auth().updateUser(userRecord.uid, {
        email: email,
        password: currentPassword,
      });
    })
    .then(() => {
      // If authentication succeeds, update the password
      return admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
      });
    })
    .then(() => {
      // Password updated successfully
      res.status(200).json({ message: 'Password updated successfully' });
    })
    .catch((error) => {
      // Handle errors during the process
      console.error('Change password error:', error);
      let errorMessage = 'Error changing password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      }
      res.status(400).json({ error: errorMessage });
    });
});



router.post('/verify', (req, res) => {
  const { userId, verifyNumber } = req.body;

  // Fetch user data from the database
  const db = admin.database();
  const usersRef = db.ref('users');
  if (!userId || !verifyNumber) {
    return res.status(400).json({ error: 'Missing userId or verifyNumber in request body' });
  }else{

  usersRef.child(userId).once('value', (snapshot) => {
    const userData = snapshot.val();

    if (!userData) {
      res.status(404).json({ error: 'User not found' });
    } else {
      const storedVerifyNumber = userData.verifyNumber;
      const storeFirstname = userData.firstName;
      const storeemail = userData.email

      console.log(storedVerifyNumber,verifyNumber);

      if (verifyNumber == storedVerifyNumber) {
        // Verification successful, update emailVerification to true
        usersRef.child(userId).update({ emailVerification: true })
          .then(() => {
            res.status(200).json({ message: 'Verification successful' });

            client.sendEmailWithTemplate({
              From: 'info@koppoh.com',
              To: storeemail,
              TemplateId: '34126600',
              TemplateModel: {
                storeFirstname   
              },
            })
            
            

          })
          .catch((updateError) => {
            console.error('Update error:', updateError);
            res.status(500).json({ error: 'Server error' });
          });
      } else {
        res.status(400).json({ error: 'Incorrect verification number' });
      }
    }
  });


}

});

router.post('/assist', (req, res) => {
  try {
      const {email, phone, message,subject} = req.body;

      if (!email || !phone || !message || !subject) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      else{

        client.sendEmailWithTemplate({
          From: 'info@koppoh.com',
          To: 'info@koppoh.com',
          TemplateId: '34142331',
          TemplateModel: {
            email,
            phone,
            message,
            subject

          },
        })         

      }
  } 
  catch (error) {
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});



router.post('/Message', (req, res) => {
  try {
      const {email, firstName,lastName, message,subject} = req.body;

      if (!email || !firstName || !message || !subject || !lastName) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      else{

        client.sendEmailWithTemplate({
          From: 'info@koppoh.com',
          To: 'info@koppoh.com',
          TemplateId: '34142478',
          TemplateModel: {
            email,
            message,
            subject,
            firstName,
            lastName

          },
        })         

      }
  } 
  catch (error) {
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
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
  // Example usage in an Express.js route
 
  
  

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

 
  module.exports = router;