require('dotenv').config();
const { sendEmail } = require('./config/email'); // adjust path if needed

async function testEmail() {
  try {
    await sendEmail('dhaddho24@gmail.com', 'verificationEmail', 123456);
    console.log('Test email sent successfully!');
  } catch (err) {
    console.error('Test email failed:', err);
  }
}

testEmail();
