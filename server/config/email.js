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
  }),
  otpEmail: (otp) => ({
    subject: 'Your OTP for Second Striker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">OTP Verification</h2>
        <p>You requested an OTP. Please use the code below to verify your action:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes.
        </p>
      </div>
    `
  }),
  passwordReset: (resetURL) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>You have requested a password reset. Please click on the link below to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link is valid for 1 hour. If you did not request a password reset, please ignore this email.
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

const emailService = {
  sendEmail
};

module.exports = emailService;