const authenticateUser = (req, res, next) => {
  const userId = req.headers.userid;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if the user exists or perform any additional checks based on your requirements
  // You might want to store user data in a Firestore collection or another database

  req.user = { uid: userId };
  next();
};

// Logout endpoint
app.post('/logout', authenticateUser, (req, res) => {
  // Perform any additional cleanup or session management if needed
  const { uid } = req.user;
  // You may want to update your database or perform any necessary actions on logout

  res.json({ message: `Logout successful for user ${uid}` });
});