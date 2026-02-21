require('dotenv').config({ path: './server/.env' });
const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const User = require('../models/User');
const League = require('../models/League');
const Fixture = require('../models/Fixture');
const LeagueTable = require('../models/LeagueTable');
const JoinRequest = require('../models/JoinRequest');
const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/test';

let authToken;
let userId;

describe('League Controller', () => {
  before(async () => {
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    // Create a test user and get a token
    await request(app)
      .post('/users/register')
      .send({
        username: 'leagueuser',
        email: 'league@example.com',
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/users/login')
      .send({
        email: 'league@example.com',
        password: 'password123'
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;
    
    // Add some balance to the user
    await User.findByIdAndUpdate(userId, { $inc: { balance: 1000 } });
  });

  afterEach(async () => {
    // Clear the database after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe('POST /league/create', () => {
    it('should create a new league and deduct the fee from the user balance', async () => {
      const initialUser = await User.findById(userId);
      const initialBalance = initialUser.balance;

      const res = await request(app)
        .post('/league/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test League',
          fee: 100,
          numberOfTeams: 4
        });

      expect(res.statusCode).to.equal(201);
      expect(res.body.league).to.have.property('name', 'Test League');
      expect(res.body.league.owner.toString()).to.equal(userId);
      expect(res.body.userBalance).to.equal(initialBalance - 100);

      const updatedUser = await User.findById(userId);
      expect(updatedUser.balance).to.equal(initialBalance - 100);
    });

    it('should return 400 for insufficient balance', async () => {
      await User.findByIdAndUpdate(userId, { balance: 50 }); // Set balance low
      const res = await request(app)
        .post('/league/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test League Low Balance',
          fee: 100
        });
      
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Insufficient balance');
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/league/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                fee: 100 // Name is missing
            });
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'League name and fee are required');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
            .post('/league/create')
            .send({
                name: 'Test League No Auth',
                fee: 100
            });
        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message', 'No token, authorization denied');
    });
  });

  describe('GET /league/get', () => {
    it('should return a list of leagues for the authenticated user', async () => {
      // Create a league first
      await request(app)
        .post('/league/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My First League',
          fee: 50,
          numberOfTeams: 4
        });

      const res = await request(app)
        .get('/league/get')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.above(0);
      expect(res.body[0]).to.have.property('name', 'My First League');
      expect(res.body[0]).to.have.property('fee', 50);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/league/get');

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'No token, authorization denied');
    });
  });

  describe('GET /league/get/:leagueId', () => {
    let createdLeagueId;

    beforeEach(async () => {
      // Create a league first
      const createRes = await request(app)
        .post('/league/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Specific League',
          fee: 75,
          numberOfTeams: 4
        });
      createdLeagueId = createRes.body.league.leagueId;
    });

    it('should return a specific league by ID for the authenticated user', async () => {
      const res = await request(app)
        .get(`/league/get/${createdLeagueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.league).to.have.property('_id', createdLeagueId);
      expect(res.body.league).to.have.property('name', 'Specific League');
      expect(res.body.league).to.have.property('fee', 75);
      expect(res.body.league).to.have.property('creator');
      expect(res.body.league.creator).to.have.property('username'); // Populated field
    });

    it('should return 404 if the league is not found', async () => {
      const res = await request(app)
        .get(`/league/get/nonexistentid`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).to.equal(404);
      expect(res.body).to.have.property('message', 'League not found');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get(`/league/get/${createdLeagueId}`);

      expect(res.statusCode).to.equal(401);
      expect(res.body).to.have.property('message', 'No token, authorization denied');
    });
  });

  describe('PATCH /league/update/:leagueId', () => {
    let createdLeagueId;

    beforeEach(async () => {
      // Create a league first
      const createRes = await request(app)
        .post('/league/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'League to Update',
          fee: 10,
          numberOfTeams: 4
        });
      createdLeagueId = createRes.body.league.leagueId;
    });

    it('should update the league successfully if the user is the creator and league is in draft status', async () => {
      const res = await request(app)
        .patch(`/league/update/${createdLeagueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rules: ['Rule 1', 'Rule 2'],
          fixtureType: 'singleRound'
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('League updated successfully');
      expect(res.body.league.rules).to.deep.equal(['Rule 1', 'Rule 2']);
      expect(res.body.league.fixtureType).to.equal('singleRound');

      const updatedLeague = await League.findById(createdLeagueId);
      expect(updatedLeague.rules).to.deep.equal(['Rule 1', 'Rule 2']);
      expect(updatedLeague.fixtureType).to.equal('singleRound');
    });

    it('should return 404 if the league is not found', async () => {
      const res = await request(app)
        .patch(`/league/update/nonexistentid`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name'
        });
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.have.property('error', 'League not found');
    });

    it('should return 403 if the user is not the creator', async () => {
      // Create another user
      await request(app)
        .post('/users/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123'
        });
      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });
      const otherUserAuthToken = loginRes.body.token;

      const res = await request(app)
        .patch(`/league/update/${createdLeagueId}`)
        .set('Authorization', `Bearer ${otherUserAuthToken}`)
        .send({
          name: 'New Name'
        });
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.have.property('error', 'Only admin can update the league');
    });

    it('should return 400 if the league is not in draft status', async () => {
      // Update league status to ongoing
      await League.findByIdAndUpdate(createdLeagueId, { status: 'ongoing' });

      const res = await request(app)
        .patch(`/league/update/${createdLeagueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name'
        });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('error', 'Cannot edit league once it has started');
    });

        it('should return 401 if no token is provided', async () => {

          const res = await request(app)

            .patch(`/league/update/${createdLeagueId}`)

            .send({

              name: 'New Name'

            });

          expect(res.statusCode).to.equal(401);

          expect(res.body).to.have.property('message', 'No token, authorization denied');

        });

      });

    

      describe('POST /league/invite', () => {

        let createdLeagueId;

        let invitedUserId;

        let invitedUserToken;

    

        beforeEach(async () => {

          // Create a league

          const createRes = await request(app)

            .post('/league/create')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              name: 'League to Invite',

              fee: 10,

              numberOfTeams: 4

            });

          createdLeagueId = createRes.body.league.leagueId;

    

          // Create a user to invite

          await request(app)

            .post('/users/register')

            .send({

              username: 'inviteduser',

              email: 'invited@example.com',

              password: 'password123'

            });

          const loginRes = await request(app)

            .post('/users/login')

            .send({

              email: 'invited@example.com',

              password: 'password123'

            });

          invitedUserId = loginRes.body.user.id;

          invitedUserToken = loginRes.body.token;

        });

    

        it('should send an invitation to a user successfully', async () => {

          const res = await request(app)

            .post('/league/invite')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              leagueId: createdLeagueId,

              userId: invitedUserId

            });

    

          expect(res.statusCode).to.equal(200);

          expect(res.body).to.have.property('message', 'Join request sent to user');

    

          const joinRequest = await JoinRequest.findOne({

            referenceId: createdLeagueId,

            userId: invitedUserId

          });

          expect(joinRequest).to.exist;

          expect(joinRequest.status).to.equal('pending');

        });

    

        it('should return 404 if the league is not found', async () => {

          const res = await request(app)

            .post('/league/invite')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              leagueId: 'nonexistentid',

              userId: invitedUserId

            });

          expect(res.statusCode).to.equal(404);

          expect(res.body).to.have.property('message', 'League does not exist');

        });

    

        it('should return 400 if a join request has already been sent', async () => {

          // Send first invitation

          await request(app)

            .post('/league/invite')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              leagueId: createdLeagueId,

              userId: invitedUserId

            });

    

          // Send second invitation

          const res = await request(app)

            .post('/league/invite')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              leagueId: createdLeagueId,

              userId: invitedUserId

            });

    

          expect(res.statusCode).to.equal(400);

          expect(res.body).to.have.property('message', 'A join request has already been sent to this user');

        });

    

        it('should return 400 if the user is already a member', async () => {

          // Add user directly to league members

          await League.findByIdAndUpdate(createdLeagueId, { $push: { members: invitedUserId } });

    

          const res = await request(app)

            .post('/league/invite')

            .set('Authorization', `Bearer ${authToken}`)

            .send({

              leagueId: createdLeagueId,

              userId: invitedUserId

            });

    

          expect(res.statusCode).to.equal(400);

          expect(res.body).to.have.property('message', 'User is already a member');

        });

    

        it('should return 401 if no token is provided', async () => {

          const res = await request(app)

            .post('/league/invite')

            .send({

              leagueId: createdLeagueId,

              userId: invitedUserId

            });

          expect(res.statusCode).to.equal(401);

          expect(res.body).to.have.property('message', 'No token, authorization denied');

        });

      });

      describe('PATCH /league/start/:leagueId', () => {
        let createdLeagueId;
        let otherUserId;
    
        beforeEach(async () => {
          // Create a league
          const createRes = await request(app)
            .post('/league/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: 'League to Start',
              fee: 10,
              numberOfTeams: 4
            });
          createdLeagueId = createRes.body.league.leagueId;
    
          // Create other users and add them to the league to meet numberOfTeams requirement
          for (let i = 0; i < 3; i++) {
            await request(app)
              .post('/users/register')
              .send({
                username: `member${i}`,
                email: `member${i}@example.com`,
                password: 'password123'
              });
            const loginRes = await request(app)
              .post('/users/login')
              .send({
                email: `member${i}@example.com`,
                password: 'password123'
              });
            await League.findByIdAndUpdate(createdLeagueId, { $push: { members: loginRes.body.user.id } });
          }
    
          // Create another user who is not the creator
          await request(app)
            .post('/users/register')
            .send({
              username: 'outsider',
              email: 'outsider@example.com',
              password: 'password123'
            });
          const outsiderLoginRes = await request(app)
            .post('/users/login')
            .send({
              email: 'outsider@example.com',
              password: 'password123'
            });
          otherUserId = outsiderLoginRes.body.user.id;
        });
    
        it('should start the league successfully if the user is the creator and conditions are met', async () => {
          const res = await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${authToken}`);
    
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('message', 'League started successfully');
          expect(res.body.league.status).to.equal('ongoing');
          expect(res.body.fixtures).to.be.an('array').and.to.have.lengthOf.above(0);
          expect(res.body.table).to.be.an('array').and.to.have.lengthOf(4);
    
          const updatedLeague = await League.findById(createdLeagueId);
          expect(updatedLeague.status).to.equal('ongoing');
        });
    
        it('should return 404 if the league is not found', async () => {
          const res = await request(app)
            .patch(`/league/start/nonexistentid`)
            .set('Authorization', `Bearer ${authToken}`);
          expect(res.statusCode).to.equal(404);
          expect(res.body).to.have.property('message', 'League not found');
        });
    
        it('should return 403 if the user is not the creator', async () => {
          const otherUserAuthToken = (await request(app).post('/users/login').send({ email: 'outsider@example.com', password: 'password123' })).body.token;
          
          const res = await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${otherUserAuthToken}`);
    
          expect(res.statusCode).to.equal(403);
          expect(res.body).to.have.property('message', 'Only the league creator can start the league');
        });
    
        it('should return 400 if the league is not in draft status', async () => {
          // Manually change status to ongoing
          await League.findByIdAndUpdate(createdLeagueId, { status: 'ongoing' });
    
          const res = await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${authToken}`);
          expect(res.statusCode).to.equal(400);
          expect(res.body).to.have.property('message', 'League must be in draft status to start');
        });
    
        it('should return 400 if member count does not match required team count', async () => {
          // Remove a member to break the condition
          await League.findByIdAndUpdate(createdLeagueId, { $pop: { members: 1 } });
    
          const res = await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${authToken}`);
          expect(res.statusCode).to.equal(400);
          expect(res.body).to.have.property('message', 'Member count does not match required team count');
        });
    
        it('should return 401 if no token is provided', async () => {
          const res = await request(app)
            .patch(`/league/start/${createdLeagueId}`);
          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('message', 'No token, authorization denied');
        });
      });
    
      describe('GET /league/:leagueId/table', () => {
        let createdLeagueId;
    
        beforeEach(async () => {
          // Create a league
          const createRes = await request(app)
            .post('/league/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: 'League for Table',
              fee: 10,
              numberOfTeams: 4
            });
          createdLeagueId = createRes.body.league.leagueId;
    
          // Create 3 other users and add them to the league to meet numberOfTeams requirement
          for (let i = 0; i < 3; i++) {
            await request(app)
              .post('/users/register')
              .send({
                username: `tablemember${i}`,
                email: `tablemember${i}@example.com`,
                password: 'password123'
              });
            const loginRes = await request(app)
              .post('/users/login')
              .send({
                email: `tablemember${i}@example.com`,
                password: 'password123'
              });
            await League.findByIdAndUpdate(createdLeagueId, { $push: { members: loginRes.body.user.id } });
          }
    
          // Start the league to generate table entries
          await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${authToken}`);
        });
    
        it('should return the league table for a given league ID', async () => {
          const res = await request(app)
            .get(`/league/${createdLeagueId}/table`)
            .set('Authorization', `Bearer ${authToken}`);
    
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(4); // 4 members in the league
          expect(res.body[0]).to.have.property('user');
          expect(res.body[0].user).to.have.property('username');
          expect(res.body[0]).to.have.property('points');
        });
    
        it('should return 404 if the league table is not found (invalid leagueId)', async () => {
          const res = await request(app)
            .get(`/league/nonexistentid/table`)
            .set('Authorization', `Bearer ${authToken}`);
          expect(res.statusCode).to.equal(404);
          expect(res.body).to.have.property('message', 'League not found');
        });
    
        it('should return 401 if no token is provided', async () => {
          const res = await request(app)
            .get(`/league/${createdLeagueId}/table`);
          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('message', 'No token, authorization denied');
        });
      });
    
      describe('GET /league/:leagueId/fixtures', () => {
        let createdLeagueId;
    
        beforeEach(async () => {
          // Create a league
          const createRes = await request(app)
            .post('/league/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: 'League for Fixtures',
              fee: 10,
              numberOfTeams: 4
            });
          createdLeagueId = createRes.body.league.leagueId;
    
          // Create 3 other users and add them to the league to meet numberOfTeams requirement
          for (let i = 0; i < 3; i++) {
            await request(app)
              .post('/users/register')
              .send({
                username: `fixturemember${i}`,
                email: `fixturemember${i}@example.com`,
                password: 'password123'
              });
            const loginRes = await request(app)
              .post('/users/login')
              .send({
                email: `fixturemember${i}@example.com`,
                password: 'password123'
              });
            await League.findByIdAndUpdate(createdLeagueId, { $push: { members: loginRes.body.user.id } });
          }
    
          // Start the league to generate fixtures
          await request(app)
            .patch(`/league/start/${createdLeagueId}`)
            .set('Authorization', `Bearer ${authToken}`);
        });
    
        it('should return the league fixtures for a given league ID', async () => {
          const res = await request(app)
            .get(`/league/${createdLeagueId}/fixtures`)
            .set('Authorization', `Bearer ${authToken}`);
    
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.above(0); // Assuming fixtures are generated
          expect(res.body[0]).to.have.property('team1');
          expect(res.body[0].team1).to.have.property('username');
          expect(res.body[0]).to.have.property('team2');
          expect(res.body[0].team2).to.have.property('username');
        });
    
        it('should return 404 if the league is not found (invalid leagueId)', async () => {
          const res = await request(app)
            .get(`/league/nonexistentid/fixtures`)
            .set('Authorization', `Bearer ${authToken}`);
          expect(res.statusCode).to.equal(404);
          expect(res.body).to.have.property('message', 'League not found');
        });
    
        it('should return 401 if no token is provided', async () => {
          const res = await request(app)
            .get(`/league/${createdLeagueId}/fixtures`);
          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('message', 'No token, authorization denied');
        });
      });
    });

    