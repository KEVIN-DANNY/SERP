const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'serp_cloud_secret_key_2026_super_secure_jwt_token';

/**
 * Generates a cryptographically signed QR token and renders it as a PNG Data URL
 */
async function generateTicketQR({ ticketCode, eventId, userId, userName, userEmail }) {
  // Sign token with HMAC-SHA256
  const payload = {
    ticketCode,
    eventId,
    userId,
    userName,
    userEmail,
    issuedAt: Date.now()
  };

  const qrToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });

  // Generate QR code Data URL
  const qrImage = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    width: 320
  });

  return { qrToken, qrImage };
}

/**
 * Decodes and verifies ticket QR token
 */
function verifyTicketQR(qrToken) {
  try {
    const decoded = jwt.verify(qrToken, JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  generateTicketQR,
  verifyTicketQR
};
