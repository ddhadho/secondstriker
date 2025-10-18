const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD 
  }
});

// Email templates
const emailTemplates = {
  verificationEmail: (otp) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering! Please use the code below to verify your email address:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
  })
};


// Utility function to send emails
const sendEmail = async (to, template, data = {}) => {
  try {
    const emailContent = emailTemplates[template](data);
    const info = await transporter.sendMail({
      from: `"Second Striker" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };