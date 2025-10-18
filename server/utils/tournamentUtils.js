const mongoose = require('mongoose');
const LeagueTable = require('../models/LeagueTable');
const Tournament = require('../models/Tournament');

const TournamentUtils = {
  /**
   * Randomly assigns members into groups based on the number of groups and teams per group.
   */
  generateTournamentGroups: (members, numberOfGroups, teamsPerGroup) => {
    if (!Array.isArray(members) || members.length < 2) {
      throw new Error('Members array must contain at least 2 players.');
    }
    if (!members.every(member => mongoose.Types.ObjectId.isValid(member))) {
      throw new Error('All members must be valid MongoDB ObjectIds.');
    }

    // Shuffle members and split into groups
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
    const groups = Array.from({ length: numberOfGroups }, () => []);

    shuffledMembers.forEach((member, index) => {
      const groupIndex = index % numberOfGroups;
      groups[groupIndex].push(member);
    });

    // Validate group sizes
    if (groups.some(group => group.length > teamsPerGroup)) {
      throw new Error('Too many members for the given configuration of groups and teams.');
    }

    // Convert group indices to letters (A, B, C, ...)
    return groups.map((group, index) => ({
      groupLetter: String.fromCharCode(65 + index), // Convert index to letters: 0 -> A, 1 -> B, etc.
      teams: group
    }));
  },

  /**
   * Generates fixtures for either group stage or knockout rounds.
   */
  generateTournamentFixtures: (groups, fixtureType, format, competitionType) => {
    let fixtures = [];
  
    if (format === 'groupKnockout') {
      groups.forEach((group) => {
        const teams = group.teams;
        const numberOfTeams = teams.length;
  
        if (numberOfTeams === 3) {
          // Explicit fixtures for exactly 3 teams
          const threeTeamFixtures = [
            {
              competitionType,
              group: group.groupLetter,
              round: 1,
              team1: teams[0],
              team2: teams[1],
              isHomeAway: fixtureType === 'homeAway',
              status: 'pending',
              stage: 'groupStage',
              result: { team1Score: null, team2Score: null }
            },
            {
              competitionType,
              group: group.groupLetter,
              round: 2,
              team1: teams[2],
              team2: teams[0],
              isHomeAway: fixtureType === 'homeAway',
              status: 'pending',
              stage: 'groupStage',
              result: { team1Score: null, team2Score: null }
            },
            {
              competitionType,
              group: group.groupLetter,
              round: 3,
              team1: teams[1],
              team2: teams[2],
              isHomeAway: fixtureType === 'homeAway',
              status: 'pending',
              stage: 'groupStage',
              result: { team1Score: null, team2Score: null }
            }
          ];
  
          // Add home-away fixtures if applicable
          if (fixtureType === 'homeAway') {
            const reverseFixtures = threeTeamFixtures.map(fixture => ({
              ...fixture,
              team1: fixture.team2,
              team2: fixture.team1,
              round: fixture.round + 3,
              isHomeAway: true
            }));
            fixtures.push(...threeTeamFixtures, ...reverseFixtures);
          } else {
            fixtures.push(...threeTeamFixtures);
          }
        } else {
          // Logic for groups with more than 3 teams
          const numberOfTeams = group.teams.length;
          const rounds = numberOfTeams - 1; 
          const matchesPerRound = Math.floor(numberOfTeams / 2);
          let teamsArray = [...group.teams];
  
          for (let round = 0; round < rounds; round++) {
            for (let match = 0; match < matchesPerRound; match++) {
              const homeTeam = teamsArray[match];
              const awayTeam = teamsArray[teamsArray.length - 1 - match];
  
              if (homeTeam && awayTeam) {
                fixtures.push({
                  competitionType,
                  group: group.groupLetter,
                  round: round + 1,
                  team1: homeTeam,
                  team2: awayTeam,
                  isHomeAway: fixtureType === 'homeAway',
                  status: 'pending',
                  stage: 'groupStage',
                  result: { team1Score: null, team2Score: null }
                });
              }
            }
  
            const lastTeam = teamsArray.pop();
            teamsArray.splice(1, 0, lastTeam);
          }
  
          // For home-and-away fixtures, create reverse fixtures
          if (fixtureType === 'homeAway') {
            const reverseFixtures = fixtures
              .filter(fixture => fixture.group === group.groupLetter)
              .map(fixture => ({
                competitionType,
                group: fixture.group,
                round: fixture.round + rounds / 2,
                team1: fixture.team2,
                team2: fixture.team1,
                isHomeAway: true,
                status: 'pending',
                result: { team1Score: null, team2Score: null }
              }));
            fixtures = [...fixtures, ...reverseFixtures];
          }
        }
      });
    } else if (format === 'knockout') {
      // Knockout format: sequentially pair teams from the first group
      const teams = groups[0].teams; // Single group for knockout
      let round = 1;
  
      while (teams.length > 1) {
        const roundFixtures = [];
        for (let i = 0; i < teams.length; i += 2) {
          const team1 = teams[i];
          const team2 = teams[i + 1];
  
          if (team1 && team2) {
            roundFixtures.push({
              competitionType,
              round,
              team1,
              team2,
              status: 'pending',
              stage: 'knock-out',
              result: { team1Score: null, team2Score: null }
            });
          }
        }
  
        fixtures.push(...roundFixtures);
        round += 1;
        // Simulate winners for next round (placeholder logic for progression)
        teams.splice(0, teams.length, ...roundFixtures.map(fixture => fixture.team1)); // Replace with actual logic in real usage
      }
    }
  
    return fixtures;
  },
  
  /**
   * Initializes the tables for group stages.
   */
  initializeTournamentTable: (groups, competitionType) => {
    const tables = [];

    groups.forEach((group) => {
      const table = group.teams.map(userId => ({
        competitionType,
        group: group.groupLetter, // Store group letter (A, B, C, etc.)
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

      tables.push(...table);
    });

    return tables;
  },

  determineQualifyingTeams: async function(tournamentId) {
    // Fetch league tables for the tournament
    const leagueTables = await LeagueTable.find({
      competitionId: tournamentId
    })
    .populate('user', '_id username') // Changed from teamId to user
    .sort({ group: 1 })
    .exec();
 
    if (!Array.isArray(leagueTables) || leagueTables.length === 0) {
      throw new Error('No league tables found for tournament');
    }
   
    // Group teams by their group
    const groupedLeagueTables = leagueTables.reduce((groups, team) => {
      const group = team.group;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(team);
      return groups;
    }, {});
 
    let qualifyingTeams = [];
 
    // Process each group and select top 2 teams
    Object.values(groupedLeagueTables).forEach(group => {
      // Sort teams by points and goal difference
      group.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.goalDifference - a.goalDifference;
      });
 
      // Select top 2 teams and extract just their user field
      const topTwoTeams = group.slice(0, 2).map(team => team.user._id); // Changed from teamId to user
      qualifyingTeams.push(...topTwoTeams);
    });
 
    if (qualifyingTeams.length === 0) {
      throw new Error('No teams qualified for knockout stage');
    }
 
    return qualifyingTeams; // Now returns array of actual user IDs
  },  

  /**
   * Generates seeded positions for a standard tournament bracket
   * @param {number} numTeams - Total number of teams (must be power of 2)
   * @returns {Array} Array of paired positions for first round matches
   */
  generateStandardBracketPositions(numTeams) {
    if (!Number.isInteger(Math.log2(numTeams))) {
      throw new Error('Number of teams must be a power of 2');
    }

    const seeds = Array.from({ length: numTeams }, (_, i) => i + 1);
    const pairs = [];
    
    const pairTeams = (arr) => {
      if (arr.length === 2) {
        pairs.push([arr[0], arr[1]]);
        return;
      }
      
      const half = arr.length / 2;
      const top = arr.slice(0, half);
      const bottom = arr.slice(half).reverse();
      
      for (let i = 0; i < half; i++) {
        pairs.push([top[i], bottom[i]]);
      }
    };

    pairTeams(seeds);
    return pairs;
  },

  /**
   * Determines the round name based on number of teams
   * @param {number} numTeams - Number of teams in the round
   * @returns {string} Round name
   */
  getRoundName(numTeams) {
    switch (numTeams) {
      case 2: return 'final';
      case 4: return 'semiFinal';
      case 8: return 'quarterFinal';
      default: return `roundOf${numTeams}`;
    }
  },

  /**
   * Generates knockout stage fixtures with proper team placement
   * @param {Array} qualifyingTeams - Array of qualified team objects
   * @param {string} tournamentId - Tournament ID
   * @param {string} fixtureType - 'single' or 'homeAway'
   * @param {boolean} hasGroups - Whether tournament has group stages
   * @returns {Array} Array of knockout fixtures
   */
  async generateKnockoutStageFixtures(qualifyingTeams, tournamentId, fixtureType, hasGroups = false) {
    try {
      if (!Array.isArray(qualifyingTeams) || qualifyingTeams.length === 0) {
        throw new Error('Invalid qualifying teams array');
      }

      const numTeams = qualifyingTeams.length;
      if (!Number.isInteger(Math.log2(numTeams))) {
        throw new Error('Number of qualifying teams must be a power of 2');
      }

      const roundName = this.getRoundName(numTeams);
      let fixtures = [];

      if (hasGroups) {
        // Group teams by their original group
        const teamsByGroup = qualifyingTeams.reduce((acc, team) => {
          if (!acc[team.group]) {
            acc[team.group] = [];
          }
          acc[team.group].push(team);
          return acc;
        }, {});

        // Sort groups alphabetically
        const sortedGroups = Object.keys(teamsByGroup).sort();
        
        // Generate fixtures by pairing teams from different groups
        for (let i = 0; i < sortedGroups.length; i += 2) {
          const groupA = sortedGroups[i];
          const groupB = sortedGroups[i + 1];

          if (!groupA || !groupB) continue;

          // Sort teams within each group by their position
          const groupATeams = teamsByGroup[groupA].sort((a, b) => a.groupPosition - b.groupPosition);
          const groupBTeams = teamsByGroup[groupB].sort((a, b) => a.groupPosition - b.groupPosition);

          // Create matches: 1st of A vs 2nd of B and 1st of B vs 2nd of A
          fixtures.push(
            {
              tournamentId,
              round: roundName,
              position: i * 2 + 1,
              matchNumber: i * 2 + 1,
              team1: groupATeams[0],
              team2: groupBTeams[1],
              stage: 'knockout',
              status: 'pending',
              isHomeAway: fixtureType === 'homeAway',
              team1Score: null,
              team2Score: null
            },
            {
              tournamentId,
              round: roundName,
              position: i * 2 + 2,
              matchNumber: i * 2 + 2,
              team1: groupBTeams[0],
              team2: groupATeams[1],
              stage: 'knockout',
              status: 'pending',
              isHomeAway: fixtureType === 'homeAway',
              team1Score: null,
              team2Score: null
            }
          );
        }
      } else {
        // Use standard tournament seeding for non-group tournaments
        const bracketPositions = this.generateStandardBracketPositions(numTeams);
        const sortedTeams = [...qualifyingTeams].sort((a, b) => a.seedPosition - b.seedPosition);

        fixtures = bracketPositions.map((pair, index) => {
          const [pos1, pos2] = pair;
          const team1 = sortedTeams[pos1 - 1];
          const team2 = sortedTeams[pos2 - 1];

          return {
            tournamentId,
            round: roundName,
            position: index + 1,
            matchNumber: index + 1,
            team1: team1,
            team2: team2,
            stage: 'knockout',
            status: 'pending',
            isHomeAway: fixtureType === 'homeAway',
            team1Score: null,
            team2Score: null
          };
        });
      }

      // Generate reverse fixtures if home/away format
      if (fixtureType === 'homeAway') {
        const reverseFixtures = fixtures.map(fixture => ({
          ...fixture,
          round: `${fixture.round}Reverse`,
          team1: fixture.team2,
          team2: fixture.team1,
          matchNumber: fixture.matchNumber
        }));
        
        return [...fixtures, ...reverseFixtures];
      }

      return fixtures;
    } catch (error) {
      console.error('Error generating knockout fixtures:', error);
      throw error;
    }
  }
};

module.exports = TournamentUtils;
