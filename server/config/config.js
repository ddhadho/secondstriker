require('dotenv').config();  

const getConfig = (env) => ({
  frontendUrl: process.env.FRONTEND_DEV_URL, 
  backendUrl: process.env.BACKEND_DEV_URL,
  apiUrl: process.env.API_DEV_URL, 
  mongoURI: process.env.MONGO_DEV_URI, 
  jwtSecret: process.env.JWT_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    shortcode: process.env.MPESA_SHORTCODE,
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke', 
  },
  email: {
    from: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

const environment = process.env.NODE_ENV;

const currentConfig = getConfig(environment);

const requiredKeys = [
  'frontendUrl', 
  'backendUrl', 
  'apiUrl', 
  'mongoURI',
  'jwtSecret',
  'sessionSecret',
];
requiredKeys.forEach(key => {
  if (!currentConfig[key]) {
    console.error(`Missing required configuration: ${key}`); 
    throw new Error(`Missing required configuration: ${key}`);
  }
});

// Export the configuration object
module.exports = currentConfig;
