const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/TournamentController');
const auth = require('../middleware/auth');
const joinRequestController = require('../controllers/JoinRequestController');

// Create Tournament
router.post('/create', auth, tournamentController.createTournament);

// edit league
router.patch('/update/:tournamentId', auth, tournamentController.updateTournament);

// Route for invitation
router.post('/invite', auth, tournamentController.inviteUserToTournament);

//route to start tournament
router.patch('/start/:tournamentId', auth, tournamentController.startTournament);

// Route to get tournament table by tournament ID
router.get('/:tournamentId/table', auth, tournamentController.getTournamentTable);

// Progress to Knockout Stages
router.post('/:tournamentId/startKnockout', auth, tournamentController.startKnockout);

// Get Tournaments
router.get('/get', auth, tournamentController.getTournaments);

// Route to get a specific tournament by ID
router.get('/get/:tournamentId', auth, tournamentController.getTournamentById);

// Route to get groupstage fixtures by tournament ID
router.get('/:tournamentId/fixtures', auth, tournamentController.getgroupFixtures);

// Route to get knockout fixtures by tournament ID
router.get('/:tournamentId/knockoutFixtures', auth, tournamentController.getknockoutFixtures);

//router to check if fixtures are complete 
router.get('/:competitionId/fixturesComplete', auth, tournamentController.checkAllFixturesCompleted);

// Route to update fixtures
router.put('/:tournamentId/updateFixtures/:fixtureId', auth, tournamentController.updateFixtureResult);

// Route to update knockout fixtures
router.put('/:tournamentId/updateKnockoutFixtures/:fixtureId', auth, tournamentController.updateFixtureAndProgress);

// Route to finish the tournament and distribute rewards
router.post('/:tournamentId/finish', auth, tournamentController.finishTournament);

module.exports = router;