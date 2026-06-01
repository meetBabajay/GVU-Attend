const jwt = require('jsonwebtoken');

/**
 * Generates a signed token to embed in a QR code.
 * @param {string} sessionId Class Session ID
 * @param {string} qrSecretSalt Dynamic salt generated for this active session
 * @returns {string} Signed JWT token
 */
const generateQRToken = (sessionId, qrSecretSalt) => {
  const secretKey = (process.env.JWT_SECRET || 'computing_attendance_secret_key_2026') + qrSecretSalt;
  
  return jwt.sign(
    { sessionId, timestamp: Date.now() },
    secretKey,
    { expiresIn: '3m' } // QR token valid for only 3 minutes from generation
  );
};

/**
 * Verifies a scanned QR token.
 * @param {string} token Scanned token string
 * @param {string} sessionId Class Session ID
 * @param {string} qrSecretSalt Dynamic salt for the session
 * @returns {object} Decoded payload
 */
const verifyQRToken = (token, sessionId, qrSecretSalt) => {
  const secretKey = (process.env.JWT_SECRET || 'computing_attendance_secret_key_2026') + qrSecretSalt;
  
  try {
    const decoded = jwt.verify(token, secretKey);
    
    if (decoded.sessionId !== sessionId) {
      throw new Error('Token does not match the active session');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('QR code has expired');
    }
    throw new Error('Invalid QR code signature');
  }
};

module.exports = {
  generateQRToken,
  verifyQRToken
};
