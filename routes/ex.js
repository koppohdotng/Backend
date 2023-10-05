const express = require('express');
const admin = require('firebase-admin');
const app = express();

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Replace with your Firebase project's Realtime Database URL
});

// Middleware to check if the request is authenticated
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
app.get('/api/user', isAuthenticated, (req, res) => {
  // You can access user information from req.user
  const user = req.user;
  res.status(200).json({ message: 'Authentication successful', user });
});

// Start the Express.js server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
