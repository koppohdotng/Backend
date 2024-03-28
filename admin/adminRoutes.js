const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Firebase Admin SDK with your service account key

var postmark = require("postmark");
var client = new postmark.ServerClient("61211298-3714-4551-99b0-1164f8a9cb33");

router.post('/deactivateAdmin/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch the admin from the database using the userId
    const adminSnapshot = await admin.database().ref(`/admins/${userId}`).once('value');
    const adminData = adminSnapshot.val();

    if (!adminData) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Create a new object with updated values 
    const updatedAdminData = {
      
      Accesspermission: false,
      Adminprofilepermission: false,
      Analyticspermission: false,
      Applicationpermission: false,
      Logpermission: false,
      adminProfileCheckbox: false,
      feedbackCheckbox: false,
      manageApplicationCheckbox: false,
      managePermissionCheckbox: false,
      managerUserCheckbox: false,
      viewAnalyticsCheckbox: false,
      viewLogsCheckbox: false,
      deactivate: true, // New field added and set to true
    };

    // Update the admin in the database with the new object
    await admin.database().ref(`/admins/${userId}`).update(updatedAdminData);

    res.json({ message: 'Admin deactivated successfully', adminId: userId });
  } catch (error) {
    console.error('Error deactivating admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/loginAdmin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch the admin from the database using the email
    const adminSnapshot = await admin.database().ref('/admins').orderByChild('email').equalTo(email).once('value');
    const adminData = adminSnapshot.val();

    if (!adminData) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Extract the first (and only) admin from the result
    const adminId = Object.keys(adminData)[0];
    const admin = adminData[adminId];

    // Check if the account is deactivated
    if ( !admin.deactivate || admin.deactivate === true) {
      return res.status(403).json({ error: 'Account is currently deactivated' });
    }

    // Check if the passwordChange field is set to true
  else{

    if (admin.passwordChange === true) {
     
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
      }
      
      
   }

    else{
      // Check the password
    if (password === admin.password) {
      // If the password is correct, you can perform additional login logic here
      return res.status(200).json({ message: 'Login success' });
    }
    }

  }
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/changePassword', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Fetch the admin from the database using the email
    const adminSnapshot = await admin.database().ref('/admins').orderByChild('email').equalTo(email).once('value');
    const adminData = adminSnapshot.val();

    if (!adminData) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Extract the first (and only) admin from the result
    const adminId = Object.keys(adminData)[0];
    const admin = adminData[adminId];

    // Check if the provided current password matches the stored password
    if (currentPassword !== admin.password) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Update the password in the database
    await admin.database().ref(`/admins/${adminId}`).update({ password: newPassword, passwordChange: false });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/fundingRequest/:fundingRequestId', async (req, res) => {
  try {
      const fundingRequestId = req.params.fundingRequestId;

      // Get all users
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      let fundingRequestData = null;

      // Iterate over users to find the funding request with the specified ID
      Object.values(users).forEach(user => {
          if (user.fundingRequest && user.fundingRequest[fundingRequestId]) {
              fundingRequestData = {
                  userId: user.uid,
                  businessName: user.businessName,
                  fundingRequest: user.fundingRequest[fundingRequestId]
              };
          }
      });

      if (!fundingRequestData) {
          return res.status(404).json({
              message: 'Funding request not found'
          });
      }

      res.json(fundingRequestData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/updateReviewStage/:fundingRequestId', async (req, res) => {
  try {
      const fundingRequestId = req.params.fundingRequestId;
      const reviewStage = req.body.reviewStage;

      if (!reviewStage) {
          return res.status(400).json({
              message: 'Review stage is required'
          });
      }

      // Get all users
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      let fundingRequestUpdated = false;

      // Iterate over users to find the funding request with the specified ID
      Object.values(users).forEach(user => {
          if (user.fundingRequest && user.fundingRequest[fundingRequestId]) {
              // Update the review stage
              user.fundingRequest[fundingRequestId].reviewstage = reviewStage;
              fundingRequestUpdated = true;
          }
      });

      if (!fundingRequestUpdated) {
          return res.status(404).json({
              message: 'Funding request not found'
          });
      }

      // Update the database
      await usersRef.set(users);

      res.json({
          message: 'Review stage updated successfully'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// router.post('/admin/login', async (req, res) => {
//     try {
//       const { email } = req.body;
  
//       // Authenticate user with Firebase Authentication
//       const user = await admin.auth().getUserByEmail(email);
  
//       // Check if the user is an admin in the Realtime Database
//       const uid = user.uid;
//       const adminRef = admin.database().ref(`/admins/${uid}`);
//       const adminData = await adminRef.once('value');
  
//       if (adminData.exists() && adminData.val().isAdmin) {
//         // User is an admin, allow login
  
//         // Check superAdmin value
//         const superAdminValue = adminData.val().superAdmin;
  
//         if (superAdminValue === 'koppoh') {

//           function generateRandomNumber() {
//             return Math.floor(Math.random() * 900000) + 100000;
//           }
//           // Generate a random value
//           const randomNow = generateRandomNumber();
  
//           // Save the random value under superAdmin
//           await adminRef.update({ randomNow: randomNow });
//           client.sendEmailWithTemplate({
//             From: 'info@koppoh.com',
//             To: email,
//             TemplateId: '34746237',
//             TemplateModel: {
//               firstName : 'Koppoh',
//               verifyNumber: randomNow,
//             },
//           })
//           res.status(200).json({ message: 'Login successful. Random value generated for superAdmin.' });
//         } else {
//           // Fetch the admin's data
//           res.status(200).json({ message: 'Login successful. Fetching admin data.', adminData: adminData.val() });
//         }
//       } else {
//         // User is not an admin, deny login
//         res.status(403).json({ error: 'Unauthorized access' });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

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

  router.get('/userpagination', async (req, res) => {
    try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
  
      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);
  
      // Get users with limit and startAt
      const snapshot = await usersRef.orderByChild('Date').limitToLast(pageSize * page).startAt().once('value');
      const users = snapshot.val();
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      res.json(paginatedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/admins', async (req, res) => {
    try {
      const snapshot = await admin.database().ref('/admins').once('value');
      const admins = snapshot.val();
  
      // Extract usernames and dateOfOnboarding
      const adminDetails = Object.entries(admins).map(([adminId, adminData]) => ({
        adminId: adminId,
        adminData: adminData
        
      }));
  
      res.json(adminDetails);
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.post('/createAdmins', async (req, res) => {
    try {
      const {
      firstName,
      lastName,
        email,
        role,
        phoneNumber,
        dateOfOnboarding,
        Accesspermission,
        Adminprofilepermission,
        Analyticspermission,
        Applicationpermission,
        Logpermission,
        adminProfileCheckbox,
        feedbackCheckbox,
        manageApplicationCheckbox,
        managePermissionCheckbox,
        managerUserCheckbox,
        viewAnalyticsCheckbox,
        viewLogsCheckbox,
        roleDescription
      } = req.body;
  
      // Validate required fields
      const missingFields = [];

if (!firstName) missingFields.push('firstName');
if (!lastName) missingFields.push('lastName');
if (!email) missingFields.push('email');
if (!role) missingFields.push('role');
if (!dateOfOnboarding) missingFields.push('dateOfOnboarding');
if (!Accesspermission) missingFields.push('Accesspermission');
if (!Adminprofilepermission) missingFields.push('Adminprofilepermission');
if (!Analyticspermission) missingFields.push('Analyticspermission');
if (!Applicationpermission) missingFields.push('Applicationpermission');
if (!Logpermission) missingFields.push('Logpermission');
if (!adminProfileCheckbox) missingFields.push('adminProfileCheckbox');
if (!feedbackCheckbox) missingFields.push('feedbackCheckbox');
if (!manageApplicationCheckbox) missingFields.push('manageApplicationCheckbox');
if (!managePermissionCheckbox) missingFields.push('managePermissionCheckbox');
if (!managerUserCheckbox) missingFields.push('managerUserCheckbox');
if (!viewAnalyticsCheckbox) missingFields.push('viewAnalyticsCheckbox');
if (!viewLogsCheckbox) missingFields.push('viewLogsCheckbox');
if (!phoneNumber) missingFields.push('phoneNumber');
if (!roleDescription) missingFields.push('roleDescription');

if (missingFields.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', missingFields });
}

      // Set a default password
      const defaultPassword = '12345678';
  
      // Create a new admin object
      const newAdmin = {
        firstName,
      lastName,
        email,
        role,
        dateOfOnboarding,
        password: defaultPassword,
        Accesspermission,
        Adminprofilepermission,
        Analyticspermission,
        Applicationpermission,
        Logpermission,
        adminProfileCheckbox,
        feedbackCheckbox,
        manageApplicationCheckbox,
        managePermissionCheckbox,
        managerUserCheckbox,
        viewAnalyticsCheckbox,
        viewLogsCheckbox,
        phoneNumber,
        roleDescription
      };
  
      // Push the new admin to the database
      const newAdminRef = await admin.database().ref('/admins').push(newAdmin);

      client.sendEmailWithTemplate({
        From: 'info@koppoh.com',
        To: email,
        TemplateId: '35031463',
        TemplateModel: {
          username : firstName,
          defaultPassword: defaultPassword,
          email:email,
        },
      })
  
      res.json({ message: 'Admin added successfully', adminId: newAdminRef.key });
    } catch (error) {
      console.error('Error adding admin:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put('/updateFundingRequestReviewStage/:userID/:fundingRequestID', async (req, res) => {
    try {
        const userID = req.params.userID;
        const fundingRequestID = req.params.fundingRequestID;
        const newReviewStage = req.body.newReviewStage; // Assuming the new review stage is sent in the request body

        // Get the specified user
        const userSnapshot = await usersRef.child(userID).once('value');
        const user = userSnapshot.val();

        // Check if the user and funding request exist
        if (!user || !user.fundingRequest || !user.fundingRequest[fundingRequestID]) {
            return res.status(404).json({
                message: 'User or funding request not found'
            });
        }

        // Update the review stage for the specified funding request
        usersRef.child(`${userID}/fundingRequest/${fundingRequestID}/reviewstage`).set(newReviewStage);

        res.json({
            message: 'Funding request review stage updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/filteredReviewstage', async (req, res) => {
  try {
      const reviewStage = req.query.reviewStage || null;

      // Get all users
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      // Initialize array to store filtered funding requests with additional data
      let filteredFundingRequests = [];

      // Extract all funding requests from users and add userEmail and userId
      Object.entries(users).forEach(([userId, user]) => {
          if (user.fundingRequest) {
              Object.entries(user.fundingRequest).forEach(([fundingRequestId, request]) => {
                  const matchReviewStage = !req.query.reviewStage || request.reviewstage == reviewStage;

                  if (matchReviewStage) {
                      filteredFundingRequests.push({
                          userEmail: user.email,
                          userId: userId,
                        
                      });
                  }
              });
          }
      });

      if (filteredFundingRequests.length === 0) {
          return res.json({
              message: 'No funding requests found with the specified filters'
          });
      }

      res.json({
          filteredFundingRequests: filteredFundingRequests
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/filteredFundingRequests', async (req, res) => {
  try {
      const pageSize = 10;
      let page = req.query.page ? parseInt(req.query.page) : 1;
      const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
      const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
      const fundingType = req.query.fundingType || null;
      const reviewStage = req.query.reviewStage || null;

      // Calculate the start index for pagination
      const startIndex = pageSize * (page - 1);

      // Get all users
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      // Initialize array to store filtered funding requests with additional data
      let filteredFundingRequests = [];

      // Extract all funding requests from users and add businessName and fundingRequestId
      Object.values(users).forEach(user => {
          if (user.fundingRequest) {
              Object.entries(user.fundingRequest).forEach(([fundingRequestId, request]) => {
                  const requestTimestamp = new Date(request.date).getTime() / 1000;
                  const withinTimeRange = (!req.query.startDate || !req.query.endDate) || (requestTimestamp >= startTimestamp && requestTimestamp <= endTimestamp);
                  const matchFundingType = !req.query.fundingType || request.fundingType == fundingType;
                  const matchReviewStage = !req.query.reviewStage || request.reviewstage == reviewStage;

                  if (withinTimeRange && matchFundingType && matchReviewStage) {
                      filteredFundingRequests.push({
                          firstName: user.firstName,
                          lastName:  user.lastName,
                          businessName: user.businessName,
                          fundingRequestId: fundingRequestId,
                          ...request
                      });
                  }
              });
          }
      });

      if (filteredFundingRequests.length === 0) {
          return res.json({
              message: 'No funding requests found with the specified filters'
          });
      }

      const totalFundingRequests = filteredFundingRequests.length;
      // Extract funding requests within the desired range
      const paginatedFundingRequests = filteredFundingRequests.slice(startIndex, startIndex + pageSize);

      res.json({
          filteredFundingRequests: paginatedFundingRequests,
          totalFundingRequests: totalFundingRequests
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/sendNotification', async (req, res) => {
  try {
    const { userIds, title, message, type } = req.body;

    if (!userIds || !title || !message || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if userIds is an array, if not convert to array
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

    // Iterate through userIds and update the notifications
    const promises = userIdArray.map(async userId => {
      const userRef = await usersRef.child(userId).once('value');
      const userData = userRef.val();

      if (!userData) {
        return { userId: userId, success: false, message: 'User not found' };
      }

      // Create or update notification for the user
      const notificationRef = usersRef.child(userId).child('notifications').push();
      await notificationRef.set({
        title: title,
        message: message,
        type: type,
        notificationStatus: true
      });

      return { userId: userId, success: true, message: 'Notification sent successfully' };
    });

    // Wait for all promises to resolve
    const results = await Promise.all(promises);

    res.json({ results: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  router.get('/filteredUsers', async (req, res) => {
    try {
        const pageSize = 10;
        let page = req.query.page ? parseInt(req.query.page) : 1;
        const startTimestamp = req.query.startDate ? new Date(req.query.startDate).getTime() / 1000 : 0;
        const endTimestamp = req.query.endDate ? new Date(req.query.endDate).getTime() / 1000 : Math.floor(Date.now() / 1000);
        const registrationStatus = req.query.registrationStatus || null;
        const maxProfileCompleteness = req.query.profileCompleteness !== undefined ? req.query.profileCompleteness : null;

        // Convert "completed" to 100 and "uncompleted" to anything less
        const profileCompletenessValue = maxProfileCompleteness === "completed" ? 100 : (maxProfileCompleteness === "uncompleted" ? 99 : null);

        // Calculate the start index for pagination
        const startIndex = pageSize * (page - 1);

        // Get users within the specified time range
        const snapshot = await usersRef.orderByChild('signupdate').startAt(startTimestamp).endAt(endTimestamp).once('value');
        const users = snapshot.val();

        // Filter users with the specified registrationStatus and profileCompleteness
        const filteredUsers = Object.values(users).filter(user => {
            const withinTimeRange = user.signupdate >= startTimestamp && user.signupdate <= endTimestamp;
            const matchRegistrationStatus = registrationStatus ? user.registrationStatus === registrationStatus : true;
            const matchProfileCompleteness = profileCompletenessValue !== null
                ? (profileCompletenessValue === 100 ? user.profileCompleteness === 100 : user.profileCompleteness < 100)
                : true;

            return withinTimeRange && matchRegistrationStatus && matchProfileCompleteness;
        });

        if (filteredUsers.length === 0) {
            return res.json({
                message: 'No users found with the specified filters'
            });
        }

        const totalUsers = filteredUsers.length;
        // Extract users within the desired range
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

        // Filter and calculate values for each user
        const formattedUsers = paginatedUsers.map(user => {
            const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, registrationStatus, profileCompleteness, age, uid } = user;

            return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, registrationStatus, profileCompleteness, age, uid };
        });

        res.json({
            filteredUsers: formattedUsers,
            totalUsers: totalUsers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Intern al Server Error' });
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
      const totalIncompleteUsers = incompleteUsers.length;
    
      res.json({
        totalUsers: totalIncompleteUsers ,

        filteredUsers: formattedUsers
      });
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
      const users = snapshot.val() || {};;
    
      // Filter users with profileCompleteness equal to 100
      const completeUsers = Object.values(users).filter(user => user.profileCompleteness === 100);
    
      // Extract users within the desired range
      const paginatedUsers = completeUsers.slice(startIndex, startIndex + pageSize);
    
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness } = user;
    
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate, profileCompleteness };
      });
      const totalCompleteUsers = completeUsers.length;
    
      res.json({
        totalUsers: totalCompleteUsers,

        filteredUsers: formattedUsers
      });
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
      const users = snapshot.val() || {}; // handle null snapshot value
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate } = user;
        return { firstName, lastName, role, country, linkedIn, phoneNumber, signupdate };
      });
  
      // Calculate total number of users within the specified date range
      const totalUsers = Object.keys(users).length;
  
      res.json({ filteredUsers: formattedUsers, totalUsers: totalUsers });
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
      const users = snapshot.val() || {}; // handle null snapshot value
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness } = user;
        return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness };
      });
  
      // Calculate total number of incomplete users
      const totalIncompleteUsers = Object.values(users).filter(user => user.profileCompleteness < 100).length;
  
      res.json({  filteredUsers: formattedUsers,totalUsers: totalIncompleteUsers });
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
      const users = snapshot.val() || {}; // handle null snapshot value
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness } = user;
        return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness };
      });
  
      // Calculate total number of complete users
      const totalCompleteUsers = Object.values(users).filter(user => user.profileCompleteness === 100).length;
  
      res.json({  filteredUsers: formattedUsers, totalUsers: totalCompleteUsers });
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
      const users = snapshot.val() || {}; // handle null snapshot value
  
      // Extract users within the desired range
      const paginatedUsers = Object.values(users).slice(startIndex, startIndex + pageSize);
  
      // Filter and calculate values for each user
      const formattedUsers = paginatedUsers.map(user => {
        const { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness } = user;
        return { firstName, lastName, role, country, linkedIn, phoneNumber, profileCompleteness };
      });
  
      // Calculate total number of users
      const totalUsers = Object.values(users).length;
  
      res.json({filteredUsers: formattedUsers, totalUsers: totalUsers });
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

  router.get('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;  
  
    // Query the database to retrieve user information using the userId
    const userRef = admin.database().ref(`/users/${userId}`);
  
    userRef.once('value', (snapshot) => {
      const user = snapshot.val();
      if (user) {
        res.status(200).json({ message: 'Authentication successful', user });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
  });

  router.get('/filterCompleteness', async (req, res) => {
    try {
        const maxProfileCompleteness = req.query.profileCompleteness !== undefined ? req.query.profileCompleteness : null;

        // Convert "completed" to 100 and "uncompleted" to anything less
        const profileCompletenessValue = maxProfileCompleteness === "completed" ? 100 : (maxProfileCompleteness === "uncompleted" ? 99 : null);

        // Get all users
        const snapshot = await usersRef.once('value');
        const users = snapshot.val();

        // Filter users based on maxProfileCompleteness
        const filteredUsers = Object.values(users).filter(user => {
            const matchProfileCompleteness = profileCompletenessValue !== null
                ? (profileCompletenessValue === 100 ? user.profileCompleteness === 100 : user.profileCompleteness < 100)
                : true;

            return matchProfileCompleteness;
        });

        if (filteredUsers.length === 0) {
            return res.json({
                message: 'No users found with the specified filters'
            });
        }

        // Extract and format required fields for each user, returning only email and userId
        const formattedUsers = filteredUsers.map(user => {
            const { email, uid } = user;
            return { email, uid };
        });

        res.json({
            filteredUsers: formattedUsers,
            totalUsers: filteredUsers.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  

  router.post('/sendEmails', async (req, res) => {
    const { emails, subject, message } = req.body;

    try {
        // Iterate through each email address
        for (const email of emails) {
            // Send email using Postmark template
            const sendEmailResponse = await client.sendEmailWithTemplate({
                From: 'info@koppoh.com',
                To: email,
                TemplateId: '35347327',
                TemplateModel: {
                    subject: subject,
                    message: message
                }
            });

            console.log('Email sent to', email, 'with ID:', sendEmailResponse.MessageID);
        }

        res.status(201).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Error sending emails' });
    }
});

const dataRef = db.ref('users');

router.get('/getAllChats/:userId', (req, res) => {
  const userId = req.params.userId;

  // Ensure userId is provided
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter.' });
  }

  // Retrieve all funding requests under the specified user
  const fundingRequestsRef = dataRef.child(`${userId}/fundingRequest`);
  fundingRequestsRef.once('value', (fundingRequestsSnapshot) => {
    const allChats = [];

    // Iterate through each funding request
    fundingRequestsSnapshot.forEach((fundingRequestSnapshot) => {
      const fundingRequestId = fundingRequestSnapshot.key;
      const chatRef = fundingRequestSnapshot.child('chat');

      // Iterate through each chat message under the funding request
      chatRef.forEach((chatMessageSnapshot) => {
        const chatMessageId = chatMessageSnapshot.key;
        const chatMessage = chatMessageSnapshot.val();

        // Include additional information
        chatMessage.fundingRequestId = fundingRequestId;
        chatMessage.chatMessageId = chatMessageId;

        // Add the chat message to the array
        allChats.push(chatMessage);
      });
    });

    return res.status(200).json({
      message: 'All chat messages retrieved successfully.',
      allChats: allChats,
    });
  });
});


router.post('/storeChat/:userId/:fundingRequestId', (req, res) => {
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;
  const { sender, message, timestamp } = req.body;

  // Ensure required fields are provided
  if (!userId || !fundingRequestId || !sender || !message || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Create a chat message object
  const chatMessage = {
    sender,
    message,
    timestamp,
  };

  // Update the chat messages under the specified funding request
  const chatRef = dataRef.child(`${userId}/fundingRequest/${fundingRequestId}/chat`);
  const newChatRef = chatRef.push(chatMessage, (error) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Failed to store chat message.' });
    } else {
      const newKey = newChatRef.key;

      // Retrieve the saved chat message using the correct key
      chatRef.child(newKey).once('value', (snapshot) => {
        const savedChatMessage = snapshot.val();

        savedChatMessage.chatMessageId = newKey;

        console.log(savedChatMessage);
        return res.status(200).json({
          message: 'Chat message stored successfully.',
          savedChatMessage: savedChatMessage,
        });
      });
    }
  });
});

router.get('/getChat/:userId/:fundingRequestId', (req, res) => {
  const userId = req.params.userId;
  const fundingRequestId = req.params.fundingRequestId;

  console.log(userId,fundingRequestId)

  // Ensure required fields are provided
  if (!userId || !fundingRequestId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Retrieve all chat messages under the specified funding request
  const chatRef = dataRef.child(`${userId}/fundingRequest/${fundingRequestId}/chat`);
  chatRef.once('value', (snapshot) => {
    const chatMessages = snapshot.val();

    if (!chatMessages) {
      console.log("debe1")
      return res.status(404).json({ error: 'No chat messages found for the specified funding request.' });
    }

    // Convert chat messages object to an array
    const chatArray = Object.keys(chatMessages).map((key) => {
      console.log("debedebe")
      const chatMessage = chatMessages[key];
      chatMessage.chatMessageId = key;
      return chatMessage;
    });

    console.log(chatArray);
    return res.status(200).json({
      message: 'Chat messages retrieved successfully.',
      chatMessages: chatArray,
    });
  });
});



  module.exports = router;