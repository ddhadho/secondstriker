require('dotenv').config({ path: './server/.env' });
const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const User = require('../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let conn;

// Mock the sendEmail function
const emailService = require('../config/email');
let sendEmailStub;

describe('User Controller', () => {
  before(async () => {
    // Start the in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect Mongoose to the in-memory database
    await mongoose.connect(uri);
    conn = mongoose.connection;

    // Stub sendEmail to prevent actual emails from being sent during tests
    sendEmailStub = sinon.stub(emailService, 'sendEmail').returns(true);
  });

  afterEach(async () => {
    // Clear the database after each test
    await User.deleteMany({});
  });

  after(async () => {
    // Restore the stubbed function
    sendEmailStub.restore();
    // Disconnect Mongoose and stop the in-memory server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /users/register', () => {
    it('should register a new user and return a success message', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).to.equal(201);
      expect(res.body).to.have.property('message', 'Registration successful. Verify OTP to complete login.');
      
      // Verify that the user was saved to the database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).to.exist;
      expect(user.username).to.equal('testuser');
      // The register method in the controller has a specific check for NODE_ENV === 'test'
      // to auto-verify the email and skip sending the email.
      expect(user.isEmailVerified).to.be.true; 
      expect(user.otp).to.be.a('number'); // OTP should be generated and stored
      expect(sendEmailStub.called).to.be.false; // Email should not be sent in test env
    });

    it('should not register a user with existing email', async () => {
      // Register the first user
      await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      // Attempt to register a second user with the same email
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'anotheruser',
          email: 'test@example.com',
          password: 'anotherpassword'
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'User already exists');
    });

    it('should return 400 if required fields are missing during registration', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          password: 'password123' // Email is missing
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'All fields are required');
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post('/users/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should log in a registered user with correct credentials and return a token', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
      expect(res.body.user).to.have.property('email', 'login@example.com');
    });

    it('should not log in with incorrect password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });

    it('should not log in with unregistered email', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });

    it('should not log in if email is not verified (if not in test env)', async () => {
      // Create a user but set isEmailVerified to false
      const user = new User({
        username: 'unverifieduser',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
        otp: 123456,
        otpExpires: Date.now() + 10 * 60 * 1000
      });
      user.password = await require('bcryptjs').hash('password123', 10);
      await user.save();

      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'unverified@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.have.property('message', 'Please verify your email before logging in');
    });
  });

  describe('POST /users/verify-otp', () => {
    let testUser;
    let otp;

    beforeEach(async () => {
      // Create a user that needs OTP verification
      const user = new User({
        username: 'otpuser',
        email: 'otp@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      user.password = await require('bcryptjs').hash('password123', 10);
      otp = Math.floor(100000 + Math.random() * 900000); // Generate a fresh OTP
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      testUser = await user.save();
    });

    it('should successfully verify OTP and log in the user', async () => {
      const res = await request(app)
        .post('/users/verify-otp')
        .send({
          email: testUser.email,
          otp: testUser.otp
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'OTP verified successfully. You are now logged in.');
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isEmailVerified).to.be.true;
      expect(updatedUser.otp).to.not.exist;
      expect(updatedUser.otpExpires).to.not.exist;
    });

    it('should return 400 for invalid OTP', async () => {
      const res = await request(app)
        .post('/users/verify-otp')
        .send({
          email: testUser.email,
          otp: 999999 // Invalid OTP
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid or expired OTP');
    });

    it('should return 400 for expired OTP', async () => {
      // Set OTP to be expired
      testUser.otpExpires = Date.now() - 1; 
      await testUser.save();

      const res = await request(app)
        .post('/users/verify-otp')
        .send({
          email: testUser.email,
          otp: testUser.otp
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid or expired OTP');
    });

    it('should return 400 if email or OTP is missing', async () => {
      const res = await request(app)
        .post('/users/verify-otp')
        .send({
          email: testUser.email // OTP is missing
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Email and OTP are required');
    });
  });

  // Test for resendOtp
  describe('POST /users/resend-otp', () => {
    let userToResendOtp;

    beforeEach(async () => {
      // Create a user who needs OTP verification
      const user = new User({
        username: 'resendotpuser',
        email: 'resend@example.com',
        password: 'password123',
        isEmailVerified: false,
        otp: 111111, // Initial OTP
        otpExpires: Date.now() - 1000 // Expired OTP
      });
      user.password = await require('bcryptjs').hash('password123', 10);
      userToResendOtp = await user.save();
    });

    it('should successfully resend OTP and update user document', async () => {
      const res = await request(app)
        .post('/users/resend-otp')
        .send({ email: userToResendOtp.email });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'OTP resent successfully. Please check your email.');
      expect(sendEmailStub.calledOnce).to.be.true; // Check if email was attempted to be sent

      const updatedUser = await User.findById(userToResendOtp._id);
      expect(updatedUser.otp).to.not.equal(111111); // OTP should be new
      expect(updatedUser.otpExpires).to.be.above(Date.now()); // OTP should be valid
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/users/resend-otp')
        .send({}); // Email is missing

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Email is required');
    });

    it('should return 400 if user not found', async () => {
      const res = await request(app)
        .post('/users/resend-otp')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'User not found');
    });

    it('should return 400 if email is already verified', async () => {
      userToResendOtp.isEmailVerified = true;
      await userToResendOtp.save();

      const res = await request(app)
        .post('/users/resend-otp')
        .send({ email: userToResendOtp.email });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Email is already verified');
    });
  });

  // Test for getProfile
  describe('GET /users/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login a user to get an auth token
      await request(app)
        .post('/users/register')
        .send({
          username: 'profileuser',
          email: 'profile@example.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: 'profile@example.com',
          password: 'password123'
        });
      authToken = loginRes.body.token;
      userId = loginRes.body.user.id;
    });

    it('should return the user profile with a valid token', async () => {
      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('email', 'profile@example.com');
      expect(res.body).to.have.property('username', 'profileuser');
      expect(res.body).to.not.have.property('password'); // Password should not be returned
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/users/profile');

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'No token, authorization denied');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'Token is not valid');
    });
  });

  // Test for updateProfile
  describe('PUT /users/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login a user to get an auth token
      await request(app)
        .post('/users/register')
        .send({
          username: 'updateuser',
          email: 'update@example.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: 'update@example.com',
          password: 'password123'
        });
      authToken = loginRes.body.token;
      userId = loginRes.body.user.id;
    });

    it('should successfully update user profile', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername',
          phoneNumber: '1234567890'
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'Profile updated successfully');
      expect(res.body.user).to.have.property('username', 'newusername');
      expect(res.body.user).to.have.property('phoneNumber', '1234567890');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.username).to.equal('newusername');
      expect(updatedUser.phoneNumber).to.equal('1234567890');
    });

    it('should return 400 for invalid updates', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'somevalue'
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid updates');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .put('/users/profile')
        .send({ username: 'newusername' });

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'No token, authorization denied');
    });
  });

  // Test for updatePhoneNumber (redundant with updateProfile, but kept for explicit testing if needed)
  describe('PUT /users/update-phone', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      await request(app)
        .post('/users/register')
        .send({
          username: 'phoneuser',
          email: 'phone@example.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: 'phone@example.com',
          password: 'password123'
        });
      authToken = loginRes.body.token;
      userId = loginRes.body.user.id;
    });

    it('should successfully update user phone number', async () => {
      const res = await request(app)
        .put('/users/update-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '0712345678'
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'Phone number updated successfully');
      expect(res.body).to.have.property('phoneNumber', '0712345678');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.phoneNumber).to.equal('0712345678');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .put('/users/update-phone')
        .send({ phoneNumber: '0712345678' });

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'No token, authorization denied');
    });
  });

  // Test for requestPasswordReset
  describe('POST /users/request-password-reset', () => {
    let registeredUser;

    beforeEach(async () => {
      registeredUser = await User.create({
        username: 'resetuser',
        email: 'reset@example.com',
        password: await require('bcryptjs').hash('password123', 10),
        isEmailVerified: true
      });
    });

    it('should successfully send password reset instructions', async () => {
      const res = await request(app)
        .post('/users/request-password-reset')
        .send({ email: registeredUser.email });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'Password reset instructions sent to your email');
      expect(sendEmailStub.calledOnce).to.be.true; 

      const updatedUser = await User.findById(registeredUser._id);
      expect(updatedUser.passwordResetToken).to.exist;
      expect(updatedUser.passwordResetExpires).to.be.above(Date.now());
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/users/request-password-reset')
        .send({});

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Email is required');
    });

    it('should return 400 if user not found', async () => {
      const res = await request(app)
        .post('/users/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'User not found');
    });
  });

  // Test for resetPassword
  describe('POST /users/reset-password', () => {
    let userForReset;
    let resetToken;

    beforeEach(async () => {
      userForReset = await User.create({
        username: 'resetpassuser',
        email: 'resetpass@example.com',
        password: await require('bcryptjs').hash('oldpassword', 10),
        isEmailVerified: true
      });

      // Manually generate and store a reset token for the user
      resetToken = require('crypto').randomBytes(32).toString('hex');
      userForReset.passwordResetToken = require('crypto')
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      userForReset.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await userForReset.save();
    });

    it('should successfully reset user password with a valid token', async () => {
      const newPassword = 'newpassword123';
      const res = await request(app)
        .post('/users/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('message', 'Password reset successful');

      const updatedUser = await User.findById(userForReset._id);
      const isPasswordMatch = await require('bcryptjs').compare(newPassword, updatedUser.password);
      expect(isPasswordMatch).to.be.true;
      expect(updatedUser.passwordResetToken).to.not.exist;
      expect(updatedUser.passwordResetExpires).to.not.exist;
    });

    it('should return 400 for invalid reset token', async () => {
      const res = await request(app)
        .post('/users/reset-password')
        .send({
          token: 'invalidtoken',
          password: 'newpassword123'
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid or expired password reset token');
    });

    it('should return 400 for expired reset token', async () => {
      userForReset.passwordResetExpires = Date.now() - 1; // Expired
      await userForReset.save();

      const res = await request(app)
        .post('/users/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid or expired password reset token');
    });

    it('should return 400 if token or password is missing', async () => {
      const res = await request(app)
        .post('/users/reset-password')
        .send({
          token: resetToken // Password is missing
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Password reset token and new password are required');
    });
  });
});
