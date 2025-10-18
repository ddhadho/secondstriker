const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');

class UserController {
  static async register(req, res) {
    const { username, email, password } = req.body;
  
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Generate OTP here and store in database
      const otp = Math.floor(100000 + Math.random() * 900000); // Random 6-digit OTP
  
      // Hash the password before creating the user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new user but don't log them in yet
      const user = new User({
        username,
        email,
        password: hashedPassword,  // Store hashed password
        otp,  // Add OTP to the user document for verification
        otpExpires: Date.now() + 10 * 60 * 1000 // 10-minute expiry
      });
  
      await user.save();
  
      // Send OTP to user's email (using your email utility)
      await sendEmail(email, 'verificationEmail', otp);
  
      res.status(201).json({
        message: 'Registration successful. Verify OTP to complete login.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
  
  static async verifyOtp(req, res) {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
  
    try {
      // Find user by email and verify OTP and expiration
      const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() } // OTP is still valid
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
  
      // OTP is valid, mark email as verified and clear OTP fields
      user.isEmailVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
  
      // Generate JWT token for the verified user
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '3h' }
      );
  
      res.json({
        message: 'OTP verified successfully. You are now logged in.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: 'Server error during OTP verification' });
    }
  }

  // User Login
  static async login(req, res) {
    const { username, email, password } = req.body;
  
    if ((!username && !email) || !password) {
      return res.status(400).json({
        message: 'Either username or email, and password are required'
      });
    }
  
    try {
      // Find user by username or email
      const user = await User.findOne({
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      if (!user.isEmailVerified) {
        return res.status(403).json({
          message: 'Please verify your email before logging in'
        });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '3h' }
      );

      const expirationTime = Date.now() + (60 * 60 * 1000);
  
      return res.json({
        token,
        expirationTime,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          balance: user.balance,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
  
  // Get User Profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  }

  // Update Phone Number
  static async updatePhoneNumber(req, res) {
    const { phoneNumber } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.phoneNumber = phoneNumber;
      await user.save();

      res.json({
        message: 'Phone number updated successfully',
        phoneNumber: user.phoneNumber
      });
    } catch (error) {
      console.error('Phone update error:', error);
      res.status(500).json({ message: 'Server error while updating phone number' });
    }
  }

  // Request Password Reset
  static async requestPasswordReset(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

      await user.save();

      const resetURL = `${process.env.BASE_URL}/reset-password/${resetToken}`;
      await sendEmail(email, 'passwordReset', resetURL);

      res.json({
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Error sending password reset email' });
    }
  }

  // Reset Password
  static async resetPassword(req, res) {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Password reset token and new password are required'
      });
    }

    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired password reset token'
        });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Server error during password reset' });
    }
  }

  static async resendOtp(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new OTP and set expiration time
      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

      // Save OTP and expiration to user record
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send the OTP via email
      await sendEmail(email, 'otpEmail', otp); // Use an OTP email template

      res.json({ message: 'OTP resent successfully. Please check your email.' });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Error resending OTP' });
    }
  }

  // Update User Profile
  static async updateProfile(req, res) {
    const allowedUpdates = ['username', 'email', 'phoneNumber'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      updates.forEach(update => {
        user[update] = req.body[update];
      });

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  }
}

module.exports = UserController;