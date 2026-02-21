require('dotenv').config({ path: './server/.env' });
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app'); // Assuming your express app is exported from app.js
const User = require('../models/User');

const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27017/test';

describe('Authentication API', () => {

  before(async () => {
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        });
      expect(res.statusCode).to.equal(201);
      expect(res.body).to.have.property('message', 'Registration successful. Verify OTP to complete login.');
    });

    it('should not register a user with an existing email', async () => {
      await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'anotheruser',
          email: 'testuser@example.com',
          password: 'password123'
        });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'User already exists');
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/users/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123'
            });
    });

    it('should log in a registered user and return a token', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
    });

    it('should not log in with incorrect credentials', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        });
      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });

});
