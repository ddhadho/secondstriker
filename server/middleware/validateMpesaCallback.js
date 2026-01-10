const logger = require('../utils/logger');

/**
 * Safaricom's official IP addresses
 * Source: Safaricom Daraja API Documentation
 * Update this list if Safaricom adds new IPs
 */
const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.128',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74'
];

/**
 * Middleware to validate M-Pesa callback requests
 * Checks IP whitelist and secret token
 */

const validateMpesaCallback = (req, res, next) => {
  try {
    // ========================================
    // STEP 1: Extract Client IP Address
    // ========================================
    
    // Handle various proxy configurations
    let clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;
    
    // x-forwarded-for can contain multiple IPs, get the first one
    if (clientIP && clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    
    // Remove IPv6 prefix if present (::ffff:192.168.1.1 -> 192.168.1.1)
    const normalizedIP = clientIP.replace('::ffff:', '').trim();
    
    logger.info('M-Pesa callback received', { 
      ip: normalizedIP,
      endpoint: req.path,
      method: req.method
    });
    
    // ========================================
    // STEP 2: Validate IP Whitelist
    // ========================================
    
    // Skip IP validation in development/testing
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NODE_ENV === 'test';
    
    if (isProduction && !SAFARICOM_IPS.includes(normalizedIP)) {
      logger.error('SECURITY ALERT: Unauthorized M-Pesa callback attempt', {
        ip: normalizedIP,
        endpoint: req.path,
        headers: req.headers
      });
      
      return res.status(403).json({ 
        ResultCode: 1, 
        ResultDesc: 'Forbidden - Invalid source IP address' 
      });
    }
    
    if (isDevelopment) {
      logger.warn('Development mode: IP whitelist check skipped', {
        ip: normalizedIP
      });
    }
    
    // ========================================
    // STEP 3: Validate Secret Token
    // ========================================
    
    const expectedToken = process.env.MPESA_CALLBACK_SECRET;
    
    if (!expectedToken) {
      logger.error('CONFIGURATION ERROR: MPESA_CALLBACK_SECRET not set in environment');
      return res.status(500).json({ 
        ResultCode: 1, 
        ResultDesc: 'Internal server error' 
      });
    }
    
    // Check token in multiple places (header or query parameter)
    const providedToken = req.headers['x-mpesa-token'] || 
                         req.headers['x-callback-token'] ||
                         req.query.token;
    
    if (!providedToken) {
      logger.error('SECURITY ALERT: M-Pesa callback without token', {
        ip: normalizedIP,
        endpoint: req.path
      });
      
      return res.status(403).json({ 
        ResultCode: 1, 
        ResultDesc: 'Forbidden - Missing authentication token' 
      });
    }
    
    // Use timing-safe comparison to prevent timing attacks
    const crypto = require('crypto');
    const providedBuffer = Buffer.from(providedToken);
    const expectedBuffer = Buffer.from(expectedToken);
    
    // Ensure buffers are same length before comparison
    if (providedBuffer.length !== expectedBuffer.length) {
      logger.error('SECURITY ALERT: Invalid M-Pesa callback token', {
        ip: normalizedIP,
        endpoint: req.path
      });
      
      return res.status(403).json({ 
        ResultCode: 1, 
        ResultDesc: 'Forbidden - Invalid authentication token' 
      });
    }
    
    // Timing-safe comparison
    const tokensMatch = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    
    if (!tokensMatch) {
      logger.error('SECURITY ALERT: Invalid M-Pesa callback token', {
        ip: normalizedIP,
        endpoint: req.path
      });
      
      return res.status(403).json({ 
        ResultCode: 1, 
        ResultDesc: 'Forbidden - Invalid authentication token' 
      });
    }
    
    // ========================================
    // STEP 4: All Checks Passed
    // ========================================
    
    logger.info('M-Pesa callback authenticated successfully', {
      ip: normalizedIP,
      endpoint: req.path
    });
    
    // Proceed to the actual callback handler
    next();
    
  } catch (error) {
    logger.error('Error in M-Pesa callback validation', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    });
  }
};

module.exports = validateMpesaCallback;