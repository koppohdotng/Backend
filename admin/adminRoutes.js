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
            TemplateId: '34746237',
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

  router.post('/confirm-number', async (req, res) => {
    try {
      const { email, number } = req.body;
  
      // Authenticate user with Firebase Authentication
      const user = await admin.auth().getUserByEmail(email);
  
      // Check if the user has a stored randomNow value
      const uid = user.uid;
      const userRef = admin.database().ref(`/admins/${uid}`);
      const userData = await userRef.once('value');
  
      if (userData.exists() && userData.val().randomNow === Number(number)) {
        // Number matches, confirmation successful
        res.status(200).json({ message: 'Confirmation successful. Number matches.' ,userData: userData.val()});
      } else {
        // Number does not match or user not found
        res.status(403).json({ error: 'Confirmation failed. Incorrect number or user not found.' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  const db = admin.database();
  const usersRef = db.ref('users');

  // router.get('/userpagination', async (req, res) => {
  //   try {
  //     const pageSize = 10;
  //     let page = req.query.page ? parseInt(req.query.page) : 1;
  
  //     // Calculate the start index for pagination
  //     const startIndex = pageSize * (page - 1);
  
  //     // Get users with limit and startAt
  //     const snapshot = await usersRef.orderByChild('Date').limitToLast(pageSize * page).startAt().once('value');
  //     const users = snapshot.val();
  
  //     // Extract users within the desired range
  //     const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
  //     res.json(paginatedUsers);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  
  router.get('/filteredUsers', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
      const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
      const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
      const registrationStatus = req.query.registrationStatus || null;
      const maxProfileCompleteness = req.query.profileCompleteness !== undefined ? req.query.profileCompleteness : null;
    
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
    
      // Get users within the specified time range
      const snapshot = await usersRef.orderByChild('signupdate').startAt(startTimestamp).endAt(endTimestamp).once('value');
      const users = snapshot.val();
    
      // Filter users with the specified registrationStatus and profileCompleteness
      const filteredUsers = Object.values(users).filter(user => {
        const withinTimeRange = user.signupdate >= startTimestamp && user.signupdate <= endTimestamp;
        const matchRegistrationStatus = registrationStatus ? user.registrationStatus === registrationStatus : true;
        const matchProfileCompleteness = maxProfileCompleteness !== null
          ? (maxProfileCompleteness === 100 ? user.profileCompleteness === 100 : user.profileCompleteness < 100)
          : true;
        
        return withinTimeRange && matchRegistrationStatus && matchProfileCompleteness;
      });

      // Extract users within the desired range
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
    
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, registrationStatus, profileCompleteness, age } = user;
    
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, registrationStatus, profileCompleteness, age };
      });
    
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

 

  
  router.get('/incompleteUsersPaginationBySignupdate', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
      const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
      const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
    
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
    
      // Get users within the signupdate range
      const snapshot = await usersRef.orderByChild('signupdate').startAt(startTimestamp).endAt(endTimestamp).once('value');
      const users = snapshot.val();
    
      // Filter users with profileCompleteness less than 100
      const incompleteUsers = Object.values(users).filter(user => user.profileCompleteness < 100);
    
      // Extract users within the desired range
      const paginatedUsers = incompleteUsers.slice(startIndex, startIndex + pageSize);
    
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness } = user;
    
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness };
      });
    
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
     
  router.get('/completeUsersPaginationBySignupdate', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
      const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
      const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
    
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
    
      // Get users with profileCompleteness equal to 100 and within the signupdate range
      const snapshot = await usersRef.orderByChild('signupdate').startAt(startTimestamp).endAt(endTimestamp).once('value');
      const users = snapshot.val();
    
      // Filter users with profileCompleteness equal to 100
      const completeUsers = Object.values(users).filter(user => user.profileCompleteness === 100);
    
      // Extract users within the desired range
      const paginatedUsers = completeUsers.slice(startIndex, startIndex + pageSize);
    
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness } = user;
    
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness };
      });
    
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }); 

  router.get('/userpaginationbysignupdate', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
      const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
      const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
  
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
  
      // Get users with limit and startAt based on signupdate
      const snapshot = await usersRef.orderByChild('signupdate').startAt(startTimestamp).endAt(endTimestamp).limitToLast(pageSize * page).once('value');
      const users = snapshot.val();
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate } = user;
  
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate };
      });
  
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
   

  router.get('/incompleteUsersPagination', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
  
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
  
      // Get users with profileCompleteness less than 100
      const snapshot = await usersRef.orderByChild('profileCompleteness').endBefore(100).once('value');
      const users = snapshot.val();
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness } = user;
  
        // Check the profile completeness status
        return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness };
      });
  
      // Remove null entries from the array
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get('/completeUsersPagination', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
  
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
  
      // Get users with profileCompleteness equal to 100
      const snapshot = await usersRef.orderByChild('profileCompleteness').equalTo(100).once('value');
      const users = snapshot.val();
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness } = user;
  
        // Check the profile completeness status
        return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness };
      });
  
      // Remove null entries from the array
      res.json(formattedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get('/userpagination', async (req, res) => {
  try {
    const pageSize = 10;
    let page = req.query.page ? parseInt(req.query.page) : 1;
    const profileCompleteness = req.query.profile || null;

    // Calculate the start index for pagination
    const startIndex = pageSize * (page - 1);

    // Get users with limit and startAt
    const snapshot = await usersRef.orderByChild('Date').limitToLast(pageSize * page).startAt().once('value');
    const users = snapshot.val();

    // Extract users within the desired range
    const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);

    // Filter and calculate values for each user
    const formattedUsers = paginatedUsers.map(user => {
      const { firstName, lastName, role, country, linkedIn,phoneNumber, profileCompleteness } = user;

      

      // Check the profile completeness status
       return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness};
    
    }); // Remove null entries from the array

    res.json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
      res.status(400).json({ error: 'Password reset link generation failed'});
    }

  });

  router.get('/users/pages', async (req, res) => {
    try {
      const pageSize = 10;
      const currentPage = req.query.page || 1; // Assuming you're using query parameter 'page'
  
      const snapshot = await usersRef.once('value');
      const totalUsers = snapshot.numChildren();
      const totalPages = Math.ceil(totalUsers / pageSize);
  
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = currentPage * pageSize;
      
      const usersSnapshot = await usersRef.orderByChild('createdAt').limitToFirst(endIdx).startAt(startIdx).once('value');
      const usersOnCurrentPage = usersSnapshot.numChildren();
  
      res.json({"number of pages": totalPages, "number of users": totalUsers});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  module.exports = router;