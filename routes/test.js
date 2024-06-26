// router.post('/signup', (req, res) => {
//   const { firstName, lastName, email, password, refFrom } = req.body;
//   // Function to generate a random 6-digit number
// function generateRandomNumber() {
//   return Math.floor(Math.random() * 900000) + 100000;
// }
// // Call the function to generate a random 6-digit number
// var randomNumber = generateRandomNumber();

// // Output the result
// console.log(randomNumber);
//   admin
//       .auth()
//       .getUserByEmail(email)
//       .then(() => {
//         // If the email already exists, return an error response
//         res.status(400).json({ error: 'Email already exists' });
//       })
//       .catch((getUserError) => {
//         if (getUserError.code === 'auth/user-not-found') {
//             // const signupDate= new Date();
//           // If the email does not exist, create a new user in Firebase Authentication
//           admin
//             .auth()
//             .createUser({
//               email,
//               password,
//             })
//             .then((userRecord) => {
//               // User signed up successfully
//               const emailVerification = false;
//               const firstTime = true;
//               let currentDate = new Date();
                    

//                     const dateInSeconds = Math.floor(new Date(currentDate.toISOString()).getTime() / 1000)
              
//               const userData = {
//                 firstName,
//                 lastName,
//                 email,
//                 uid: userRecord.uid,
//                 emailVerification,
//                 firstTime,
//                 refFrom,
//                 Date: currentDate.toISOString(),
//                 signupdate : dateInSeconds,
//                 verifyNumber: randomNumber
//               };
  
//               // Store user data in Firebase Realtime Database (or Firsestore)
//               const db = admin.database();
//               const usersRef = db.ref('users');

//               try {
//                 usersRef.child(userRecord.uid).set(userData, (error) => {
//                   if (error) {
//                     // Handle database error
//                     console.error('Database error:', error);
//                     res.status(500).json({ error: 'Database error' },error);
//                   } else {
//                     // Data stored successfully
//                     res.status(201).json({ message: 'Signup successful', user: userData });
//                   }
//                 });
//               } catch (databaseError) {
//                 // Handle any unexpected database error
//                 console.error('Unexpected database error:', databaseError);
//                 res.status(500).json({ error: 'Server error' });
//               }
//             })
//             .catch((signupError) => {
//               // Handle signup errors
//               console.error('Signup error:', signupError);
//               res.status(400).json({ error: 'Signup failed' }), signupError;
//             });
//         } else {
//           // Handle other errors that may occur while checking the email
//           console.error('Email check error:', getUserError);
//           res.status(500).json({ error: 'Server error' });
//         }
//       });
      
//       client.sendEmailWithTemplate({
//         From: 'info@koppoh.com',
//         To: email,
//         TemplateId: '36197708',
//         TemplateModel: {
//           firstName,
//           verifyNumber: randomNumber,
//         },
//       })
//     //   .then((response) => {
//     //     console.log('Email sent successfully:', response);
//     //     res.status(201).json({ message: 'Signup successful',});
//     //   })
//     //   .catch((error) => {
//     //     console.error('Email sending error:');
//     //     res.status(500).json({ error: 'Email sending error'});
//     //     return; // Add this line to stop the function execution
//     // })


// });

// router.post('/resendVerification', async (req, res) => {
//   const { email } = req.body;

//   try {
//     // Check if the user exists in Firebase Authentication
//     const userRecord = await admin.auth().getUserByEmail(email);

//     function generateRandomNumber() {
//       return Math.floor(Math.random() * 900000) + 100000;
//     }
//     // Generate a new random 6-digit number
//     const newRandomNumber = generateRandomNumber();

//     // Update the user's verification number in the database
//     const db = admin.database();
//     const usersRef = db.ref('users');

//     const userData = {
//       verifyNumber: newRandomNumber,
//     };

//     await usersRef.child(userRecord.uid).update(userData);

//     // Send a verification email with the new random number
//     await client.sendEmailWithTemplate({
//       From: 'info@koppoh.com',
//       To: email,
//       TemplateId: '36197708',
//       TemplateModel: {
//         verifyNumber: newRandomNumber,
//       },
//     });

//     res.status(200).json({ message: 'Verification email resent successfully' });
//   } catch (error) {
//     console.error('Error resending verification email:', error);
//     if (error.code === 'auth/user-not-found') {
//       res.status(404).json({ error: 'User not found' });
//     } else {
//       res.status(500).json({ error: 'Server error' });
//     }
//   }
// });


// router.post('/verify', (req, res) => {
//   const { userId, verifyNumber } = req.body;

//   // Fetch user data from the database
//   const db = admin.database();
//   const usersRef = db.ref('users');
//   if (!userId || !verifyNumber) {
//     return res.status(400).json({ error: 'Missing userId or verifyNumber in request body' });
//   }else{

//   usersRef.child(userId).once('value', (snapshot) => {
//     const userData = snapshot.val();

//     if (!userData) {
//       res.status(404).json({ error: 'User not found' });
//     } else {
//       const storedVerifyNumber = userData.verifyNumber;
//       const storeFirstname = userData.firstName;
//       const storeemail = userData.email

//       console.log(storedVerifyNumber,verifyNumber);

//       if (verifyNumber == storedVerifyNumber) {
//         // Verification successful, update emailVerification to true
//         usersRef.child(userId).update({ emailVerification: true })
//           .then(() => {
//             res.status(200).json({ message: 'Verification successful' });

//             client.sendEmailWithTemplate({
//               From: 'info@koppoh.com',
//               To: storeemail,
//               TemplateId: '34126600',
//               TemplateModel: {
//                 storeFirstname   
//               },
//             })
            
            

//           })
//           .catch((updateError) => {
//             console.error('Update error:', updateError);
//             res.status(500).json({ error: 'Server error' });
//           });
//       } else {
//         res.status(400).json({ error: 'Incorrect verification number' });
//       }
//     }
//   });


// }

// });
