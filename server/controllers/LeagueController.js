const League = require('../models/League');
const Fixture = require('../models/Fixture');
const LeagueTable = require('../models/LeagueTable');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const { generateRoundRobinFixtures, initializeLeagueTable } = require('../utils/leagueUtils');
const mongoose = require('mongoose');

// Create a new league with balance check and deduction
exports.createLeague = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, fee } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ message: 'League name is required' });
    }

    if (typeof fee !== 'number' || fee < 5 || fee > 999.99) {
      return res.status(400).json({ message: 'Invalid fee amount' });
    }

    // Find user and check balance
    const user = await User.findById(req.user.id).session(session);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < fee) {
      return res.status(400).json({ 
        message: 'Insufficient balance',
        currentBalance: user.balance,
        requiredFee: fee
      });
    }

    // Create new league
    const league = new League({
      name,
      fee,
      creator: req.user.id,
      members: [req.user.id], 
      status: 'draft', 
      createdAt: new Date()
    });

    // Deduct fee from user's balance
    user.balance -= fee;

    // Ensure balance is still sufficient before saving
    if (user.balance < 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Transaction failed: insufficient balance' });
    }

    // Save both user and league changes
    await user.save({ session });
    await league.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      league: {
        leagueId: league._id,
        name: league.name,
        fee: league.fee,
        createdAt: league.createdAt,
        members: league.members,
        status: league.status
      },
      userBalance: user.balance
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('League creation error:', err);
    res.status(500).json({ message: 'Failed to create league' });
  } finally {
    session.endSession();
  }
};

// Get leagues for user (both created and joined)
exports.getLeagues = async (req, res) => {
  try {
      const leagues = await League.find({
      members: req.user.id, 
  })
  .select('_id name fee creator status createdAt')
  .populate({
      path: 'creator',
      select: 'username',
  })
  .sort({ createdAt: -1 });
  
  res.json(leagues);
  } catch (err) { 
    console.error('Fetch leagues error:', err);
    res.status(500).json({ message: 'Failed to fetch leagues' });
  }
};

// Get a specific league by ID
exports.getLeagueById = async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId)
      .populate('members', 'username')
      .populate('creator', 'username');

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    res.status(200).json({
      league: league
    });
  } catch (error) {
    console.error('Error fetching league:', error);
    res.status(500).json({ message: 'Failed to fetch league' });
  }
};

exports.searchUserByUsername = async (req, res) => {
  const { username } = req.query;

  try {
    // Find a single user by the exact username
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    if (user) {
      res.json({ users: [user], totalUsers: 1, currentPage: 1, totalPages: 1 });
    } else {
      res.json({ users: [], totalUsers: 0, currentPage: 1, totalPages: 1 });
    }
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

exports.inviteUserToLeague = async (req, res) => {
  const { leagueId, userId } = req.body; 
  
  try {
    // Check if the league exists
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ message: 'League does not exist' });
    }

    // Check if there's already a pending join request for the user in this league
    const existingRequest = await JoinRequest.findOne({
      referenceId: leagueId,
      referenceType: 'League', 
      userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A join request has already been sent to this user' });
    }

    // Check if the user is already a member of the league
    if (league.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Create a new join request
    const joinRequest = new JoinRequest({
      referenceId: leagueId, 
      referenceType: 'League', 
      userId, 
      expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 
    });
    
    await joinRequest.save();
    
    res.status(200).json({ message: 'Join request sent to user' });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Error inviting user to league' });
  }
};

exports.updateLeague = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;

    // Fetch the league and check permissions
    const league = await League.findById(leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });
    if (!league.creator.equals(userId)) return res.status(403).json({ error: 'Only admin can update the league' });
    if (league.status !== 'draft') return res.status(400).json({ error: 'Cannot edit league once it has started' });

    // Handle updating fields
    const updatableFields = ['fixtureType', 'awards', 'numberOfTeams'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        league[field] = req.body[field];
      }
    });

    if (req.body.rules) {
      console.log("Updating rules:", req.body.rules);
      if (!Array.isArray(req.body.rules)) {
        return res.status(400).json({ error: "Rules must be an array." });
      }
      league.rules = [...req.body.rules];
    }
        
    // Save the updated league
    await league.save();

    res.status(200).json({ message: 'League updated successfully', league });
  } catch (error) {
    console.error('Error updating league:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller to start the league
exports.startLeague = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;

    // Find the league by its ID
    const league = await League.findById(leagueId);
    if (!league) return res.status(404).json({ message: 'League not found' });

    // Check if the requester is the league creator
    if (String(league.creator) !== String(userId)) {
      return res.status(403).json({ message: 'Only the league creator can start the league' });
    }

    // Check if the league status is 'draft'
    if (league.status !== 'draft') {
      return res.status(400).json({ message: 'League must be in draft status to start' });
    }

    // Validate that member count matches the required number of teams
    if (league.members.length !== league.numberOfTeams) {
      return res.status(400).json({ message: 'Member count does not match required team count' });
    }

    const competitionType = "League"; 

    // Generate fixtures (round-robin format)
    const fixtures = generateRoundRobinFixtures(league.members, league.fixtureType);
    const fixtureDocs = await Fixture.insertMany(fixtures.map(fixture => ({
      competitionId: league._id,
      competitionType: 'League',
      ...fixture,
    })));

    // Initialize the league table
    const table = initializeLeagueTable(league.members);
    const tableDocs = await LeagueTable.insertMany(table.map(entry => ({
      competitionId: league._id,
      competitionType: 'League',
      ...entry,
    })));

    // Update the league status to 'ongoing'
    league.status = 'ongoing';
    await league.save();

    // Respond with the success message, including fixtures and table
    res.status(200).json({
      message: 'League started successfully',
      league,
      fixtures: fixtureDocs,
      table: tableDocs,
    });

  } catch (error) {
    console.error("Error starting league:", error);
    res.status(500).json({ message: 'Failed to start league' });
  }
};

// Get league table by league ID
exports.getLeagueTable = async (req, res) => {
  try {
    const groupTables = await LeagueTable.find({ 
      competitionId: req.params.leagueId
    })
    .populate('user', 'username')
    .sort({ points: -1, goalDifference: -1, goalsFor: -1  }).exec();
  
    res.status(200).json(groupTables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group stage tables' });
  }
};

// Get league fixtures by league ID
exports.getLeagueFixtures = async (req, res) => {
  try {
    const fixtures = await Fixture.find({ 
      competitionId: req.params.leagueId
    })
    .populate('team1', 'username')
    .populate('team2', 'username');
  
    res.status(200).json(fixtures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group stage fixtures' });
  }
};

exports.updateFixtureResult = async (req, res) => {
  const { leagueId, fixtureId } = req.params;
  const { team1Score, team2Score } = req.body;
  const userId = req.user.id;
  const competitionId = leagueId

  if (team1Score == null || team2Score == null) {
    return res.status(400).json({ message: 'Both team scores are required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate league and permissions
    const league = await League.findById(leagueId).session(session);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    if (league.status !== 'ongoing') {
      return res.status(400).json({ message: 'League not started or has finished' });
    }

    if (String(league.creator) !== String(userId)) {
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

        // Remove the last form result
        if (team.form.length > 0) {
          team.form.pop();
        }
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

exports.getLeagueStats = async (req, res) => {
  const { leagueId } = req.params;

  try {
    // Get the top-scoring team
    const topScorerTeam = await LeagueTable.findOne({ leagueId })
      .sort({ goalsFor: -1 })
      .populate('user', 'username');

    // Get the team that conceded the most goals
    const mostConcededTeam = await LeagueTable.findOne({ leagueId })
      .sort({ goalsAgainst: -1 })
      .populate('user', 'username');

    // Get all completed fixtures for the league
    const fixtures = await Fixture.find({ leagueId, status: 'completed' })
      .populate('team1', 'username')
      .populate('team2', 'username');

    // Calculate total goals scored in the league
    const totalGoals = fixtures.reduce(
      (sum, fixture) => sum + (fixture.result.team1Score || 0) + (fixture.result.team2Score || 0),
      0
    );

    // Calculate total matches played
    const totalMatches = fixtures.length;

    // Calculate goals per match
    const goalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0;

    // Calculate clean sheets
    const cleanSheetCounts = {};

    fixtures.forEach(fixture => {
      if (fixture.result.team2Score === 0) {
        cleanSheetCounts[fixture.team1._id] = (cleanSheetCounts[fixture.team1._id] || 0) + 1;
      }
      if (fixture.result.team1Score === 0) {
        cleanSheetCounts[fixture.team2._id] = (cleanSheetCounts[fixture.team2._id] || 0) + 1;
      }
    });

    // Determine the team with the most clean sheets
    const topCleanSheetTeam = Object.entries(cleanSheetCounts).reduce(
      (max, [teamId, count]) => (count > max.count ? { teamId, count } : max),
      { teamId: null, count: 0 }
    );

    // Populate clean sheet stats
    const cleanSheets = Object.entries(cleanSheetCounts).map(([teamId, count]) => ({
      team: fixtures.find(f => f.team1._id.toString() === teamId || f.team2._id.toString() === teamId).team1.username, // Find team name
      count,
    }));

    // Get team name for the top clean sheet team
    const topCleanSheetTeamName = topCleanSheetTeam.teamId
      ? fixtures.find(f => f.team1._id.toString() === topCleanSheetTeam.teamId || f.team2._id.toString() === topCleanSheetTeam.teamId).team1.username
      : null;

    // Respond with the calculated stats
    res.json({
      topScorerTeam: topScorerTeam ? { name: topScorerTeam.user.username, goalsFor: topScorerTeam.goalsFor } : null,
      mostConcededTeam: mostConcededTeam
        ? { name: mostConcededTeam.user.username, goalsAgainst: mostConcededTeam.goalsAgainst }
        : null,
      goalsPerMatch,
      cleanSheets,
      topCleanSheetTeam: topCleanSheetTeamName
        ? { name: topCleanSheetTeamName, count: topCleanSheetTeam.count }
        : null,
    });
  } catch (error) {
    console.error('Error fetching league stats:', error);
    res.status(500).json({ error: 'Error fetching league stats' });
  }
};

// Check if all group stage fixtures are completed
exports.checkAllFixturesCompleted = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Find all fixtures for the league in the group stage
    const fixtures = await Fixture.find({ competitionId });

    if (!fixtures.length) {
      return res.status(200).json({ message: 'No fixtures found' });
    }

    // Check if any fixture in the group stage is not completed
    const incompleteFixture = fixtures.find(fixture => fixture.status !== 'completed');
    if (incompleteFixture) {
      return res.status(400).json({ message: 'Not all fixtures are completed' });
    }

    res.status(200).json({ message: 'All fixtures are completed' });
  } catch (error) {
    console.error('Error checking fixtures:', error);
    res.status(500).json({ message: 'Failed to check fixtures' });
  }
};

// Function to finish the league and distribute awards
exports.finishLeague = async (req, res) => {
  const { leagueId } = req.params;
  const userId = req.user.id;
  const competitionId = leagueId; 

  try {
    const league = await League.findById(leagueId)
      .populate('creator', 'username');

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only admin (creator) can finish the league
    if (league.creator._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the league creator can finish the league' });
    }

    if (league.status !== 'ongoing') {
      return res.status(400).json({ message: 'League not started or has finished' });
    }

    // Check if all fixtures are completed
    const fixtures = await Fixture.find({ competitionId });
    const incompleteFixture = fixtures.find(fixture => fixture.status !== 'completed');
    if (incompleteFixture) {
      return res.status(400).json({ message: 'Some fixtures are incomplete' });
    }

    // Fetch the league table for rankings
    const leagueTable = await LeagueTable.find({ competitionId })
      .populate('user', 'username balance') 
      .sort({ points: -1, goalDifference: -1, goalsFor: -1 });

    if (!leagueTable || leagueTable.length < 3) {
      return res.status(400).json({ message: 'Not enough participants to distribute awards' });
    }

    // Distribute rewards based on `awardsDistribution`
    const { awardsDistribution } = league;
    const { firstPlace, secondPlace, thirdPlace } = awardsDistribution;

    // Check if rewards are configured and distribute them
    if (firstPlace > 0) {
      await distributePrize(leagueTable[0].user._id, firstPlace);
    }
    if (secondPlace > 0 && leagueTable[1]) {
      await distributePrize(leagueTable[1].user._id, secondPlace);
    }
    if (thirdPlace > 0 && leagueTable[2]) {
      await distributePrize(leagueTable[2].user._id, thirdPlace);
    }

    // Update league status to 'completed'
    league.status = 'completed';
    await league.save();

    res.status(200).json({ message: 'League completed and rewards distributed' });
  } catch (error) {
    console.error('Error finishing league:', error);
    res.status(500).json({ message: 'Failed to finish league' });
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
