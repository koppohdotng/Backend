const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client('118360199442016913320');
// var postmark = require("postmark");

// const postmarkClient = new ServerClient('612112983714455199b01164f8a9cb33');

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");



const usersRef = admin.database().ref('users');

// API endpoint for searching users
app.get('/searchUsers', async (req, res) => {
  try {
    const searchText = req.query.text || '';

    // Get all users
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();

    // Initialize array to store matched users
    let matchedUsers = [];

    // Search for users matching the searchText in firstName or lastName
    Object.values(users).forEach(user => {
      if (user.firstName.toLowerCase().includes(searchText.toLowerCase()) || 
          user.lastName.toLowerCase().includes(searchText.toLowerCase())) {
        matchedUsers.push({
          uid: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
    });

    if (matchedUsers.length === 0) {
      return res.json({
        message: 'No users found matching the search text'
      });
    }

    res.json({
      matchedUsers: matchedUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




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
  // Function to generate a random 6-digit number
function generateRandomNumber() {
  return Math.floor(Math.random() * 900000) + 100000;
}
// Call the function to generate a random 6-digit number
var randomNumber = generateRandomNumber();

// Output the result
console.log(randomNumber);
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
              let currentDate = new Date();
                    

                    const dateInSeconds = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000)
              
              const userData = {
                firstName,
                lastName,
                email,
                uid: userRecord.uid,
                emailVerification,
                firstTime,
                refFrom,
                Date: currentDate.toISOString(),
                signupdate : dateInSeconds,
                verifyNumber: randomNumber
              };
  
              // Store user data in Firebase Realtime Database (or Firsestore)
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
      
      client.sendEmailWithTemplate({
        From: 'info@koppoh.com',
        To: email,
        TemplateId: '33232370',
        TemplateModel: {
          firstName,
          verifyNumber: randomNumber,
        },
      })
    //   .then((response) => {
    //     console.log('Email sent successfully:', response);
    //     res.status(201).json({ message: 'Signup successful',});
    //   })
    //   .catch((error) => {
    //     console.error('Email sending error:');
    //     res.status(500).json({ error: 'Email sending error'});
    //     return; // Add this line to stop the function execution
    // })


});

router.post('/resendVerification', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in Firebase Authentication
    const userRecord = await admin.auth().getUserByEmail(email);

    function generateRandomNumber() {
      return Math.floor(Math.random() * 900000) + 100000;
    }
    // Generate a new random 6-digit number
    const newRandomNumber = generateRandomNumber();

    // Update the user's verification number in the database
    const db = admin.database();
    const usersRef = db.ref('users');

    const userData = {
      verifyNumber: newRandomNumber,
    };

    await usersRef.child(userRecord.uid).update(userData);

    // Send a verification email with the new random number
    await client.sendEmailWithTemplate({
      From: 'info@koppoh.com',
      To: email,
      TemplateId: '33232370',
      TemplateModel: {
        verifyNumber: newRandomNumber,
      },
    });

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error);
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});



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





router.get('/login', (req, res) => {
    res.send('It is working');
  });


  
  // Example usage in an Express.js route
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
        // Check Firebase authentication
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Get the userId from the userRecord
        const userId = userRecord.uid;

        // Assuming you have a 'users' node in your Realtime Database
        const userSnapshot = await admin.database().ref('/users/' + userId).once('value');
        const userData = userSnapshot.val();

        if (userData) {
            // Respond with user data
            res.status(200).json({ message: "Login successful", user: userData });
        } else {
            res.status(404).json({ error: 'User data not found' });
        }

    } catch (error) {
        console.error('Firebase authentication error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
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