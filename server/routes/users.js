const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/resend-otp', UserController.resendOtp);

// Profile routes
router.get('/profile', auth, UserController.getProfile);
router.patch('/profile', auth, UserController.updateProfile);
router.put('/phone', auth, UserController.updatePhoneNumber);

// Password reset routes
router.post('/forgot-password', UserController.requestPasswordReset);
router.post('/reset-password', UserController.resetPassword);

module.exports = router;