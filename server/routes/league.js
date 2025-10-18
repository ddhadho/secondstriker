const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const leagueController = require('../controllers/LeagueController');
const joinRequestController = require('../controllers/JoinRequestController');

// Route to create a new league
router.post('/create', auth, leagueController.createLeague);

// Add this route for updating a league's parameters
router.patch('/update/:leagueId', auth, leagueController.updateLeague);

// Route to get leagues for a user
router.get('/get', auth, leagueController.getLeagues);

// Route to get a specific league by ID
router.get('/get/:leagueId', auth, leagueController.getLeagueById);

// Route to search for users by username
router.get('/search-user', auth, leagueController.searchUserByUsername);

// Routes for requests 
router.post('/invite', auth, leagueController.inviteUserToLeague);
router.post('/respond/:requestId/:action', auth, joinRequestController.respondToJoinRequest);
router.get('/requests', auth, joinRequestController.getJoinRequests);

// Start the league
router.patch('/start/:leagueId', auth, leagueController.startLeague);

// Route to get league table by league ID
router.get('/:leagueId/table', auth, leagueController.getLeagueTable);

// Route to get league fixtures by league ID
router.get('/:leagueId/fixtures', auth, leagueController.getLeagueFixtures);

// Route to update results
router.put('/:leagueId/updateFixtures/:fixtureId', auth, leagueController.updateFixtureResult);

// Route to get league stats
router.get('/:leagueId/stats', auth, leagueController.getLeagueStats);

// Route to check if all fixtures are completed in a league
router.get('/:competitionId/fixturesComplete', auth, leagueController.checkAllFixturesCompleted);

// Route to finish the league and distribute rewards
router.post('/:leagueId/finish', auth, leagueController.finishLeague);

module.exports = router;
