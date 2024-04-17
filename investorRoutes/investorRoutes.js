const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Firebase Admin SDK with your service account key

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");


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

router.post('/signup', (req, res) => {
    const { firstName, lastName, email, password, organisation } = req.body;
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
                        const dateInSeconds = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000);
                        
                        const userData = {
                            firstName,
                            lastName,
                            email,
                            uid: userRecord.uid,
                            emailVerification,
                            firstTime,
                            
                            Date: currentDate.toISOString(),
                            signupdate: dateInSeconds,
                            verifyNumber: randomNumber,
                            organisation: organisation || null, // Make organisation optional
                        };
                        
                        // Store user data in Firebase Realtime Database under "investors" node
                        const db = admin.database();
                        const investorsRef = db.ref('investors'); // Change reference to "investors"
                        
                        try {
                            investorsRef.child(userRecord.uid).set(userData, (error) => {
                                if (error) {
                                    // Handle database error
                                    console.error('Database error:', error);
                                    res.status(500).json({ error: 'Database error' }, error);
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
                        res.status(400).json({ error: 'Signup failed' }, signupError);
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
    // .then((response) => {
    //     console.log('Email sent successfully:', response);
    //     res.status(201).json({ message: 'Signup successful',});
    // })
    // .catch((error) => {
    //     console.error('Email sending error:');
    //     res.status(500).json({ error: 'Email sending error'});
    //     return; // Add this line to stop the function execution
    // })
});

router.post('/check-email', async (req, res) => {
    const { email } = req.body;
   console.log(email)
    const emailCheckResult = await checkEmailExistence(email);
  
    if (emailCheckResult.exists) {
      res.status(200).json({ message: emailCheckResult.message });
    } else {
      res.status(404).json({ message: emailCheckResult.message });
    }
  });


router.post('/resend-verification', (req, res) => {
    const { email } = req.body;

    // Check if the email exists
    admin
        .auth()
        .getUserByEmail(email)
        .then(() => {
            // If the email exists, generate a new verification number
            const randomNumber = generateRandomNumber();
            console.log(randomNumber);

            // Send the new verification number to the email
            client.sendEmailWithTemplate({
                From: 'info@koppoh.com',
                To: email,
                TemplateId: '33232370',
                TemplateModel: {
                    verifyNumber: randomNumber,
                },
            })
            .then(() => {
                // Verification number sent successfully
                res.status(200).json({ message: 'Verification number resent successfully' });
            })
            .catch((error) => {
                console.error('Email sending error:', error);
                res.status(500).json({ error: 'Email sending error' });
            });
        })
        .catch((getUserError) => {
            // If the email doesn't exist, return an error response
            if (getUserError.code === 'auth/user-not-found') {
                res.status(404).json({ error: 'Email not found' });
            } else {
                console.error('Email check error:', getUserError);
                res.status(500).json({ error: 'Server error' });
            }
        });
});

// Function to generate a random 6-digit number
function generateRandomNumber() {
    return Math.floor(Math.random() * 900000) + 100000;
}


router.post('/confirm-verification', (req, res) => {
    const { email, verifyNumber } = req.body;

    // Get the user data from the Realtime Database
    const db = admin.database();
    const investorsRef = db.ref('investors');
    
    investorsRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
        const userData = snapshot.val();
        if (!userData) {
            // If the email doesn't exist, return an error response
            return res.status(404).json({ error: 'Email not found' });
        }

        // If the email exists, check if the verification number matches
        const userId = Object.keys(userData)[0];
        const storedVerifyNumber = userData[userId].verifyNumber;

        if (verifyNumber === storedVerifyNumber) {
            res.status(200).json({ message: 'Verification successful' });
        } else {
            res.status(400).json({ error: 'Verification code does not match' });
        }
    }, (error) => {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Server error' });
    });
});

router.get('/get-investor-data/:investorId', (req, res) => {
    const investorId = req.params.investorId;

    // Get the user data from the Realtime Database
    const db = admin.database();
    const investorsRef = db.ref('investors');
    
    investorsRef.child(investorId).once('value', (snapshot) => {
        const investorData = snapshot.val();
        if (!investorData) {
            // If the investor ID doesn't exist, return an error response
            return res.status(404).json({ error: 'Investor not found' });
        }

        res.status(200).json({ investorData });
    }, (error) => {
        console.error('Error fetching investor data:', error);
        res.status(500).json({ error: 'Server error' });
    });
});



module.exports = router;