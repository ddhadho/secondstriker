const mongoose = require('mongoose');

const generateRoundRobinFixtures = (members, fixtureType) => {
  if (!Array.isArray(members) || members.length < 2) {
    throw new Error('Members array must contain at least 2 players');
  }
  if (!members.every(member => mongoose.Types.ObjectId.isValid(member))) {
    throw new Error('All members must be valid MongoDB ObjectIds');
  }
  if (!['homeAway', 'singleRound'].includes(fixtureType)) {
    throw new Error('Fixture type must be either "homeAway" or "singleRound"');
  }

  const numberOfTeams = members.length;

  // Use different approaches based on whether number of teams is odd or even
  if (numberOfTeams % 2 === 0) {
    return generateEvenTeamFixtures(members, fixtureType);
  } else {
    return generateOddTeamFixtures(members, fixtureType);
  }
};

const generateEvenTeamFixtures = (members, fixtureType) => {
  const numberOfTeams = members.length;
  const rounds = numberOfTeams - 1;
  const matchesPerRound = numberOfTeams / 2;
  let fixtures = [];
  
  // Create a copy of the members array
  let teamsArray = [...members];
  
  // Create round-robin schedule
  for (let round = 0; round < rounds; round++) {
    const roundFixtures = [];
    
    for (let match = 0; match < matchesPerRound; match++) {
      const homeTeam = teamsArray[match];
      const awayTeam = teamsArray[teamsArray.length - 1 - match];

      roundFixtures.push({
        team1: homeTeam,
        team2: awayTeam,
        round: round + 1,
        isHomeAway: fixtureType === 'homeAway',
        status: 'pending',
        result: { team1Score: null, team2Score: null }
      });
    }

    fixtures = [...fixtures, ...roundFixtures];
    
    // Rotate teams (keep first team fixed)
    teamsArray.splice(1, 0, teamsArray.pop());
  }

  // For home-and-away fixtures, create reverse fixtures
  if (fixtureType === 'homeAway') {
    const reverseFixtures = fixtures.map(fixture => ({
      team1: fixture.team2,
      team2: fixture.team1,
      round: fixture.round + rounds,
      isHomeAway: true,
      status: 'pending',
      result: { team1Score: null, team2Score: null }
    }));
    fixtures = [...fixtures, ...reverseFixtures];
  }

  return fixtures;
};

const generateOddTeamFixtures = (members, fixtureType) => {
  const numberOfTeams = members.length;
  const rounds = numberOfTeams;
  
  // Generate all possible pairings first
  let allPairings = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      allPairings.push({
        team1: members[i],
        team2: members[j]
      });
    }
  }

  // Organize pairings into rounds
  let fixtures = [];
  let currentRound = 1;
  
  while (allPairings.length > 0) {
    let roundTeams = new Set();
    let roundFixtures = [];
    
    // Try to fill each round with maximum possible matches
    for (let i = 0; i < allPairings.length; i++) {
      const pairing = allPairings[i];
      const team1Str = pairing.team1.toString();
      const team2Str = pairing.team2.toString();
      
      if (!roundTeams.has(team1Str) && !roundTeams.has(team2Str)) {
        roundTeams.add(team1Str);
        roundTeams.add(team2Str);
        roundFixtures.push({
          team1: pairing.team1,
          team2: pairing.team2,
          round: currentRound,
          isHomeAway: fixtureType === 'homeAway',
          status: 'pending',
          result: { team1Score: null, team2Score: null }
        });
        
        allPairings.splice(i, 1);
        i--;
      }
    }
    
    fixtures = [...fixtures, ...roundFixtures];
    currentRound++;
  }

  // For home-and-away fixtures, create reverse fixtures
  if (fixtureType === 'homeAway') {
    const reverseFixtures = fixtures.map(fixture => ({
      team1: fixture.team2,
      team2: fixture.team1,
      round: fixture.round + rounds,
      isHomeAway: true,
      status: 'pending',
      result: { team1Score: null, team2Score: null }
    }));
    fixtures = [...fixtures, ...reverseFixtures];
  }

  return fixtures;
};

const initializeLeagueTable = (members) => {
  if (!Array.isArray(members) || members.length < 3) {
    throw new Error('League must contain at least 2 players');
  }
  if (!members.every(member => mongoose.Types.ObjectId.isValid(member))) {
    throw new Error('All members must be valid MongoDB ObjectIds');
  }
  return members.map(userId => ({
    user: userId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    form: [],
    streak: 0,
    homeRecord: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
    awayRecord: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
  }));
};

module.exports = {
  generateRoundRobinFixtures,
  initializeLeagueTable
};