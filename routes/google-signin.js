// google-signin.js
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client('118360199442016913320');

async function verifyGoogleIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: '118360199442016913320',
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    throw error;
  }
}

module.exports = verifyGoogleIdToken;
