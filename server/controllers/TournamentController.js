const Tournament = require('../models/Tournament');
const Fixture = require('../models/Fixture');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const TournamentUtils = require('../utils/tournamentUtils');
const mongoose = require('mongoose');
const LeagueTable = require('../models/LeagueTable');

// Create Tournament
exports.createTournament = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { name, format, fee } = req.body;
  
      // Validate tournament parameters
      if (!name || !format || typeof fee !== 'number') {
        return res.status(400).json({ message: 'Invalid tournament configuration' });
      }
  
      const user = await User.findById(req.user.id).session(session);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check user balance
      if (user.balance < fee) {
        return res.status(400).json({ 
          message: 'Insufficient balance',
          currentBalance: user.balance,
          requiredFee: fee
        });
      }
  
      // Create the tournament
      const tournament = new Tournament({
        name,
        fee,
        format, 
        creator: req.user.id,
        members: [req.user.id],
        status: 'draft',
        createdAt: new Date()
      });
  
      // Deduct fee from user balance
      user.balance -= fee;
      await user.save({ session });
      await tournament.save({ session });
  
      await session.commitTransaction();
  
      // Respond with the tournament details
      res.status(201).json({
        tournament: {
          id: tournament._id,
          name: tournament.name,
          format: tournament.format, 
          status: tournament.status,
          code: tournament.code,
          prizePool: tournament.prizePool
        }
      });
  
    } catch (error) {
      await session.abortTransaction();
      console.error('Tournament creation error:', error);
      res.status(500).json({ message: 'Failed to create tournament' });
    } finally {
      session.endSession();
    }
};

// Get tournaments for user (both created and joined)
exports.getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({
        members: req.user.id,
    })
    .select('_id name fee creator  format status createdAt')
    .populate({
        path: 'creator',
        select: 'username',
    })
    .sort({ createdAt: -1 });
    
    res.json(tournaments);
    } catch (err) { 
      console.error('Fetch leagues error:', err);
      res.status(500).json({ message: 'Failed to fetch leagues' });
    }
};

// Get a specific tournament by ID
exports.getTournamentById = async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.tournamentId)
        .populate('members', 'username')
        .populate('creator', 'username');
  
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
  
      res.status(200).json({
        tournament: tournament
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      res.status(500).json({ message: 'Failed to fetch tournament' });
    }
  };
  
exports.updateTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user.id;
  
    // Fetch the league and check permissions
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (!tournament.creator.equals(userId)) return res.status(403).json({ error: 'Only admin can update the tournament' });
    if (tournament.status !== 'draft') return res.status(400).json({ error: 'Cannot edit tournament once it has started' });
    
    // Handle updating fields
    const updatableFields = ['fixtureType', 'awards', 'teamsPerGroup', 'numberOfGroups'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        tournament[field] = req.body[field];
      }
    });

    if (req.body.rules) {
      console.log("Updating rules:", req.body.rules);
      if (!Array.isArray(req.body.rules)) {
        return res.status(400).json({ error: "Rules must be an array." });
      }
      tournament.rules = [...req.body.rules];
    }
          
    // Save the updated league
    await tournament.save();
  
    res.status(200).json({ message: 'Tournament updated successfully', tournament });
  } catch (error) {
   console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.inviteUserToTournament = async (req, res) => {
  const { tournamentId, userId } = req.body; 
  
  try {
    // Check if the tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament does not exist' });
    }

    // Check if there's already a pending join request for the user in this league
    const existingRequest = await JoinRequest.findOne({
      referenceId: tournamentId,
      referenceType: 'Tournament', 
      userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A join request has already been sent to this user' });
    }

    // Check if the user is already a member of the tournament
    if (tournament.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    const joinRequest = new JoinRequest({
      referenceId: tournamentId, 
      referenceType: 'Tournament',
      userId, 
      expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 
    });
    
    await joinRequest.save();
    
    res.status(200).json({ message: 'Join request sent to user' });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Error inviting user to tournament' });
  }
};

exports.startTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tournament = await Tournament.findById(tournamentId).session(session);

    // Validate tournament and permissions
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (String(tournament.creator) !== String(userId)) {
      return res.status(403).json({ message: 'Only tournament creator can start' });
    }
    if (tournament.status !== 'draft') {
      return res.status(400).json({ message: 'Tournament must be in draft status' });
    }

    // Ensure the member count matches the configuration
    const expectedTeamsCount = tournament.teamsPerGroup * tournament.numberOfGroups;
    if (tournament.format === 'groupKnockout' && tournament.members.length !== expectedTeamsCount) {
      return res.status(400).json({
        message: 'Team count does not match tournament configuration',
        expected: expectedTeamsCount,
        actual: tournament.members.length
      });
    }

    let groups = [];
    let fixtures = [];

    const competitionType = "Tournament";

    if (tournament.format === 'groupKnockout') {
      // Generate groups
      groups = TournamentUtils.generateTournamentGroups(
        tournament.members,
        tournament.numberOfGroups,
        tournament.teamsPerGroup,
        tournament.format
      );

      // Generate group stage fixtures
      fixtures = TournamentUtils.generateTournamentFixtures(
        groups,
        tournament.fixtureType,
        tournament.format,
        competitionType 
      );

      // Initialize tables for groups
      const tables = TournamentUtils.initializeTournamentTable(groups, competitionType);

      // Save group tables
      const tableDocuments = await LeagueTable.insertMany(
        tables.map(table => ({
          competitionId: tournament._id,
          ...table
        })),
        { session }
      );

      // Save fixtures
      const fixtureDocuments = await Fixture.insertMany(
        fixtures.map(fixture => ({
          competitionId: tournament._id,
          ...fixture
        })),
        { session }
      );

      // Update tournament status
      tournament.status = 'ongoing';
      tournament.stage = 'groupStage';
      await tournament.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        message: 'Tournament group stage started successfully',
        tournamentId: tournament._id,
        groups: tableDocuments,
        fixtures: fixtureDocuments
      });
    } else if (tournament.format === 'knockout') {
      // Generate knockout fixtures
      fixtures = TournamentUtils.generateTournamentFixtures(
        [tournament.members], // All members in a single group for knockout
        tournament.fixtureType,
        tournament.format
      );

      // Save knockout fixtures
      const fixtureDocuments = await Fixture.insertMany(
        fixtures.map(fixture => ({
          competitionId: tournament._id,
          ...fixture
        })),
        { session }
      );

      // Update tournament status
      tournament.status = 'ongoing';
      tournament.stage = 'knockout';
      await tournament.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        message: 'Tournament knockout stage started successfully',
        tournamentId: tournament._id,
        fixtures: fixtureDocuments
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Tournament start error:', error);
    res.status(500).json({ 
      message: 'Failed to start tournament',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// Progress Tournament to Knockout Stages
exports.startKnockout = async (req, res) => {
  const { tournamentId } = req.params;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tournament = await Tournament.findById(tournamentId).session(session);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (String(tournament.creator) !== String(userId)) {
      return res.status(403).json({ message: 'Only tournament creator can progress stages' });
    }

    if (tournament.stage !== 'groupStage') {
      return res.status(400).json({ message: 'Tournament must be in group stage' });
    }
    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ message: 'Tournament has not started or is finished' });
    }

    const incompleteFixtures = await Fixture.findOne({ 
      competitionId: tournamentId, 
      stage: 'groupStage', 
      status: { $ne: 'completed' } 
    });

    if (incompleteFixtures) {
      return res.status(400).json({ message: 'All group stage matches must be completed' });
    }

    const qualifyingTeams = await TournamentUtils.determineQualifyingTeams(tournamentId);

    const knockoutFixtures = TournamentUtils.generateKnockoutStageFixtures(qualifyingTeams, tournamentId);

    const knockoutDocuments = await Fixture.insertMany(
      knockoutFixtures.map(fixture => ({
        competitionType: 'Tournament',
        competitionId: tournament._id,
        ...fixture,
        stage: 'knockout'
      }))
    );

    tournament.stage = 'knockout';
    await tournament.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: 'Knockout stages fixtures generated',
      fixtures: knockoutDocuments
    });
  } catch (error) {
    console.error('Knockout stage progression error:', error);
    await session.abortTransaction();
    res.status(500).json({ message: 'Failed to progress tournament' });
  } finally {
    session.endSession();
    console.log('Session ended.');
  }
};

// Get Tournament Details
exports.getTournamentDetails = async (req, res) => {
  try {
    const tournament = await League.findById(req.params.tournamentId)
      .populate('members', 'username');
      
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
  
    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tournament details' });
  }
};

// Get Group Stage Fixtures
exports.getgroupFixtures = async (req, res) => {
  try {
    const fixtures = await Fixture.find({ 
      competitionId: req.params.tournamentId, 
      stage: 'groupStage' 
    })
    .populate('team1', 'username')
    .populate('team2', 'username');
  
    res.status(200).json(fixtures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group stage fixtures' });
  }
};

// Get knockout Fixtures
exports.getknockoutFixtures = async (req, res) => {
  try {    
    const fixtures = await Fixture.find({ 
      competitionId: req.params.tournamentId, 
      stage: 'knockout' 
    })

    .populate('team1', 'username')
    .populate('team2', 'username');
  
    res.status(200).json(fixtures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching knockout fixtures' });
  }
};

// Check if all group stage fixtures are completed
exports.checkAllFixturesCompleted = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Find all fixtures for the league in the group stage
    const fixtures = await Fixture.find({ competitionId, stage: 'groupStage' });

    if (!fixtures.length) {
      return res.status(200).json({ message: 'No group stage fixtures found' });
    }

    // Check if any fixture in the group stage is not completed
    const incompleteFixture = fixtures.find(fixture => fixture.status !== 'completed');
    if (incompleteFixture) {
      return res.status(400).json({ message: 'Not all group stage fixtures are completed' });
    }

    res.status(200).json({ message: 'All group stage fixtures are completed' });
  } catch (error) {
    console.error('Error checking group stage fixtures:', error);
    res.status(500).json({ message: 'Failed to check group stage fixtures' });
  }
};

// Get table
exports.getTournamentTable = async (req, res) => {
  try {
    const groupTables = await LeagueTable.find({ 
      competitionId: req.params.tournamentId
    })
    .populate('user', 'username')
    .sort({ points: -1, goalDifference: -1, goalsFor: -1  }).exec();
  
    res.status(200).json(groupTables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group stage tables' });
  }
};
  
exports.updateFixtureResult = async (req, res) => {
  const { tournamentId, fixtureId } = req.params;
  const { team1Score, team2Score } = req.body;
  const userId = req.user.id;
  const competitionId = tournamentId

  if (team1Score == null || team2Score == null) {
    return res.status(400).json({ message: 'Both team scores are required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate tournament and permissions
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ message: 'Tournament not started or has finished' });
    }

    if (String(tournament.creator) !== String(userId)) {
      return res.status(403).json({ message: 'Only admin can update the results' });
    }

    // Get fixture and validate
    const fixture = await Fixture.findOne({ _id: fixtureId, competitionId }).session(session);
    if (!fixture) {
      return res.status(404).json({ message: 'Fixture not found' });
    }

    // Get league table entries
    const leagueTable = await LeagueTable.find({ competitionId }).session(session);
    if (!leagueTable) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'League table not found' });
    }

    const team1 = leagueTable.find(entry => entry.user.toString() === fixture.team1.toString());
    const team2 = leagueTable.find(entry => entry.user.toString() === fixture.team2.toString());

    if (!team1 || !team2) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Teams not found in league table' });
    }

    // Rollback previous result if fixture was already completed
    if (fixture.status === 'completed') {
      const prevTeam1Score = fixture.result.team1Score;
      const prevTeam2Score = fixture.result.team2Score;
      
      // Determine previous outcome
      const prevOutcome = prevTeam1Score > prevTeam2Score
        ? ['win', 'loss']
        : prevTeam1Score < prevTeam2Score
          ? ['loss', 'win']
          : ['draw', 'draw'];

      // Rollback function
      const rollbackStats = (team, goalsFor, goalsAgainst, result) => {
        team.played -= 1;
        team.goalsFor -= goalsFor;
        team.goalsAgainst -= goalsAgainst;
        team.goalDifference -= goalsFor - goalsAgainst;
        if (result === 'win') team.won -= 1;
        if (result === 'draw') team.drawn -= 1;
        if (result === 'loss') team.lost -= 1;
        team.points = team.won * 3 + team.drawn;

      };

      // Rollback previous stats
      rollbackStats(team1, prevTeam1Score, prevTeam2Score, prevOutcome[0]);
      rollbackStats(team2, prevTeam2Score, prevTeam1Score, prevOutcome[1]);
    }

    // Update function for new stats
    const updateTableStats = (team, goalsFor, goalsAgainst, result) => {
      team.played += 1;
      team.goalsFor += goalsFor;
      team.goalsAgainst += goalsAgainst;
      team.goalDifference += goalsFor - goalsAgainst;
      if (result === 'win') team.won += 1;
      if (result === 'draw') team.drawn += 1;
      if (result === 'loss') team.lost += 1;
      team.points = team.won * 3 + team.drawn;

      // Update home/away records
      if (fixture.isHomeAway) {
        const record = team === team1 ? team.homeRecord : team.awayRecord;
        record.played += 1;
        record.goalsFor += goalsFor;
        record.goalsAgainst += goalsAgainst;
        if (result === 'win') record.won += 1;
        if (result === 'draw') record.drawn += 1;
        if (result === 'loss') record.lost += 1;
      }
    };

    // Calculate new outcome
    const outcome = team1Score > team2Score
      ? ['win', 'loss']
      : team1Score < team2Score
        ? ['loss', 'win']
        : ['draw', 'draw'];

    // Apply new stats
    updateTableStats(team1, team1Score, team2Score, outcome[0]);
    updateTableStats(team2, team2Score, team1Score, outcome[1]);

    // Update fixture
    fixture.result = { team1Score, team2Score };
    fixture.status = 'completed';

    // Save all changes
    await fixture.save({ session });
    await team1.save({ session });
    await team2.save({ session });

    await session.commitTransaction();

    res.status(200).json({ 
      message: 'Fixture result updated successfully', 
      fixture,
      team1Stats: team1,
      team2Stats: team2
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating fixture result:', error);
    res.status(500).json({ message: 'Failed to update fixture result' });
  } finally {
    session.endSession();
  }
};

exports.updateFixtureAndProgress = async (req, res) => {
  const { tournamentId, fixtureId } = req.params;
  const { team1Score, team2Score } = req.body;
  const userId = req.user.id;

  if (team1Score == null || team2Score == null) {
    return res.status(400).json({ message: 'Both team scores are required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    // 1. Validate tournament and permissions
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ message: 'Tournament not started or has finished' });
    }

    if (String(tournament.creator) !== String(userId)) {
      return res.status(403).json({ message: 'Only admin can update the results' });
    }

    // 2. Get fixture
    const currentFixture = await Fixture.findById(fixtureId).session(session);
    if (!currentFixture) {
      return res.status(404).json({ message: 'Fixture not found' });
    }

    // 3. Update the fixture
    console.log(`Updating fixture ${fixtureId} with scores ${team1Score} - ${team2Score}`);
    currentFixture.result = { team1Score, team2Score };
    currentFixture.status = 'completed'; // Explicitly mark as completed
    await currentFixture.save({ session });

    // 4. Handle knockout progression
    if (currentFixture.isHomeAway) {
      
      // Find reverse fixture (second leg)
      const reverseFixture = await Fixture.findOne({
        tournamentId,
        round: `${currentFixture.round}Reverse`,
        team1: currentFixture.team2,
        team2: currentFixture.team1
      }).session(session);

      if (reverseFixture && !reverseFixture.completed) {
        await session.commitTransaction();
        return res.json({ message: 'First leg updated, waiting for second leg' });
      }

      if (reverseFixture && reverseFixture.completed) {
        // Aggregate score for home/away fixtures
        const aggregateScore = {
          team1: currentFixture.result.team1Score + reverseFixture.result.team2Score,
          team2: currentFixture.result.team2Score + reverseFixture.result.team1Score
        };

        console.log(`Aggregate score: ${aggregateScore.team1} - ${aggregateScore.team2}`);

        // Determine winner
        const winner = aggregateScore.team1 > aggregateScore.team2 
          ? currentFixture.team1 
          : currentFixture.team2;

        console.log(`Winner of the match: ${winner}`);

        // Progress winner to next round
        await updateKnockoutProgression(
          tournamentId,
          currentFixture.round.replace('Reverse', ''),
          currentFixture.position,
          winner,
          session
        );
      }
    } else {
      // Single match progression
      console.log(`Single match progression`);
      if (currentFixture.status === 'completed') {
        const winner = team1Score > team2Score ? currentFixture.team1 : currentFixture.team2;

        console.log(`Winner of the match: ${winner}`);

        await updateKnockoutProgression(
          tournamentId,
          currentFixture.round,
          currentFixture.position,
          winner,
          session
        );
      }
    }

    await session.commitTransaction();
    res.json({ 
      message: 'Fixture updated successfully',
      fixture: currentFixture
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating fixture:', error);
    res.status(500).json({ message: 'Failed to update fixture', error: error.message });
  } finally {
    session.endSession();
  }
};

const updateKnockoutProgression = async (
  tournamentId, 
  currentRound, 
  currentPosition, 
  winner, 
  session
) => {

  const roundProgression = {
    'roundOf16': 'quarterFinal',
    'quarterFinal': 'semiFinal',
    'semiFinal': 'final'
  };

  const nextRound = roundProgression[currentRound];
  if (!nextRound) {
    return;
  }

  // Calculate next position and determine team placement
  let nextPosition;
  let isTeam1;

  switch(currentRound) {
    case 'roundOf16':
      nextPosition = Math.ceil(currentPosition / 2);
      isTeam1 = currentPosition % 2 !== 0;
      break;
      
    case 'quarterFinal':
      if (currentPosition <= 2) {
        nextPosition = 1; // First two QFs go to SF1
        isTeam1 = currentPosition === 1;
      } else {
        nextPosition = 2; // Last two QFs go to SF2
        isTeam1 = currentPosition === 3;
      }
      break;
      
    case 'semiFinal':
      nextPosition = 1; // Only one final match
      isTeam1 = currentPosition === 1;
      break;
  }

  // Find existing fixture or create new one
  let nextFixture = await Fixture.findOne({
    competitionId: tournamentId,
    round: nextRound,
    position: nextPosition
  }).session(session);

  if (!nextFixture) {
    // Create new fixture with proper team placement
    nextFixture = await Fixture.create([{
      competitionId: tournamentId,
      competitionType: 'Tournament',
      round: nextRound,
      position: nextPosition,
      team1: isTeam1 ? winner : null,
      team2: isTeam1 ? null : winner,
      isHomeAway: false,
      team1Score: null,
      team2Score: null,
      stage: 'knockout',
      status: 'pending'
    }], { session });
    nextFixture = nextFixture[0];
  } else {
    // Update existing fixture with winner in correct position
    if (isTeam1) {
      nextFixture.team1 = winner;
    } else {
      nextFixture.team2 = winner;
    }
    await nextFixture.save({ session });
  }

  // Create reverse fixture if both teams are set and it's a home/away tie
  if (nextFixture.isHomeAway && nextFixture.team1 && nextFixture.team2) {

    const reverseExists = await Fixture.exists({
      competitionId: tournamentId,
      round: `${nextRound}Reverse`,
      position: nextPosition
    }).session(session);

    if (!reverseExists) {
      await Fixture.create([{
        competitionId: tournamentId,
        competitionType: 'Tournament',
        round: `${nextRound}Reverse`,
        team1: nextFixture.team2,
        team2: nextFixture.team1,
        position: nextPosition,
        isHomeAway: true,
        team1Score: null,
        team2Score: null,
        stage: 'knockout',
        status: 'pending'
      }], { session });
    }
  }
};

// Function to finish the tournament and distribute awards
exports.finishTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const { fixtureId, team1Score, team2Score } = req.body;
  const userId = req.user.id;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tournament = await Tournament.findById(tournamentId)
      .populate('creator', 'username')
      .session(session);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.creator._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the creator can finish the tournament' });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ message: 'Tournament not started or has finished' });
    }

    // Update the final fixture first
    const finalFixture = await Fixture.findById(fixtureId).session(session);
    if (!finalFixture || finalFixture.round !== 'final') {
      return res.status(400).json({ message: 'Invalid final fixture' });
    }

    finalFixture.result = { team1Score, team2Score };
    finalFixture.status = 'completed';
    await finalFixture.save({ session });

    // Determine winner and runner-up
    const winner = team1Score > team2Score ? finalFixture.team1 : finalFixture.team2;
    const runnerUp = team1Score > team2Score ? finalFixture.team2 : finalFixture.team1;

    // Store the winners in tournament
    tournament.winner = winner;
    tournament.runnerUp = runnerUp;

    // Distribute rewards
    const { awardsDistribution } = tournament;
    const { firstPlace, secondPlace } = awardsDistribution;

    if (firstPlace > 0) {
      await distributePrize(winner, firstPlace, session);
    }

    if (secondPlace > 0) {
      await distributePrize(runnerUp, secondPlace, session);
    }

    tournament.status = 'completed';
    await tournament.save({ session });

    await session.commitTransaction();

    // Construct the response data
    const responseData = {
      message: 'Tournament completed and rewards distributed',
      winner: winner.username,
      firstPlacePrize: firstPlace,
    };

    // Only include runner-up details if they receive a prize
    if (secondPlace > 0) {
      responseData.runnerUp = runnerUp.username;
      responseData.secondPlacePrize = secondPlace;
    }

    res.status(200).json(responseData);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error finishing tournament:', error);
    res.status(500).json({ message: 'Failed to finish tournament' });
  } finally {
    session.endSession();
  }
};

// Helper function to distribute prizes
async function distributePrize(userId, amount) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    user.balance += amount; // Assuming `balance` field exists in User schema
    await user.save();
  } catch (error) {
    console.error(`Error distributing prize to user ${userId}:`, error);
    throw new Error('Failed to distribute prize');
  }
}