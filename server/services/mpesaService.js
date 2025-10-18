const axios = require('axios');
const config = require('../config/config');

// Utility: Format phone number to international format
const formatPhoneNumber = (phoneNumber) => {

  // Remove all non-numeric characters
  const sanitizedNumber = phoneNumber.replace(/\D/g, '');

  // Ensure the number starts with '254'
  if (sanitizedNumber.startsWith('0')) {
    return `254${sanitizedNumber.slice(1)}`; // Replace leading '0' with '254'
  } else if (sanitizedNumber.startsWith('254')) {
    return sanitizedNumber; // Already in correct format
  } else {
    throw new Error('Invalid phone number format. Must start with "0" or "254".');
  }
};

const generateOriginatorConversationID = () => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  return `TXN${timestamp}${Math.floor(Math.random() * 10000)}`; // Example: TXN202311210945301234
};

const validateInput = (data, requiredFields) => {
  console.log('Validating input:', { data, requiredFields }); // Debugging input data
  const errors = [];
  requiredFields.forEach(field => {
    if (!data[field]) {
      console.log(`Missing required field: ${field}`); // Log missing fields
      errors.push(`${field} is required`);
    }
  });
  if (errors.length > 0) {
    const errorMessage = `Validation failed: ${errors.join(', ')}`;
    console.log(errorMessage); // Log validation failure
    throw new Error(errorMessage);
  }
  console.log('Input validation passed'); // Log successful validation
};


exports.generateAccessToken = async () => {
  try {
    console.log('Generating access token'); // Debugging access token generation
    const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');
    console.log('Authorization header:', auth); // Debugging authorization header

    const response = await axios.get(`${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    console.log('Access token response:', response.data); // Log response data
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating access token:', error.response?.data || error.message); // Detailed error
    throw error;
  }
};

exports.stkPush = async (phoneNumber, amount) => {
  try {
    console.log('STK push initiated with:', { phoneNumber, amount });

    // Validate input
    validateInput({ phoneNumber, amount }, ['phoneNumber', 'amount']);

    // Format the phone number
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // Generate access token
    const accessToken = await this.generateAccessToken();

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    // Generate password
    const password = Buffer.from(`${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`).toString('base64');

    // STK Push payload
    const payload = {
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhoneNumber,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: formattedPhoneNumber,
      CallBackURL: `${process.env.BASE_URL}/mpesa/callback`,
      AccountReference: 'Second Striker',
      TransactionDesc: 'Deposit to Second Striker Wallet'
    };
    console.log('STK Push payload:', payload);

    // Sending request
    const response = await axios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('STK push response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in STK push:', error.response?.data || error.message);
    throw error;
  }
};

exports.bulkPayment = async (phoneNumber, amount) => {
  try {
    validateInput({ phoneNumber, amount }, ['phoneNumber', 'amount']);

    const originatorConversationID = generateOriginatorConversationID();
    console.log('Generated OriginatorConversationID:', originatorConversationID);

    // Format the phone number
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedPhoneNumber);

    const accessToken = await this.generateAccessToken();

    const response = await axios.post(
      `${config.mpesa.baseUrl}/mpesa/b2c/v3/paymentrequest`,
      {
        OriginatorConversationID: originatorConversationID,
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'SalaryPayment',
        Amount: amount,
        PartyA: config.mpesa.shortcode,
        PartyB: formattedPhoneNumber,
        Remarks: 'Withdrawal from Second Striker',
        QueueTimeOutURL: `${process.env.BASE_URL}/mpesa/b2c/queue`,
        ResultURL: `${process.env.BASE_URL}/mpesa/b2c/result`,
        Occasion: 'Withdrawal',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Daraja B2C Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error in bulk payment:', error);
    throw error;
  }
};