<template>
  <div class="tournament-bracket q-pa-md">
    <div v-if="loading" class="flex flex-center full-height">
      <q-spinner-dots size="50px" color="primary" />
    </div>
    <div v-else class="tournament-bracket-container">
      <div class="bracket">
        <div v-for="(round, roundIndex) in rounds" :key="roundIndex" class="round">
          <div class="matches">
            <div
              v-for="(match, matchIndex) in round"
              :key="match.id"
              class="match"
              :class="{
                'match-top': matchIndex % 2 === 0,
                'match-bottom': matchIndex % 2 !== 0,
                'has-team': match.teams[0] || match.teams[1]
              }"
            >
              <div class="match-teams">
                <div
                  class="team"
                  :class="{
                    'winner': match.winner === 0,
                    'empty': !match.teams[0]
                  }"
                >
                  <span class="team-name">
                    {{ match.teams[0]?.username || 'TBD' }}
                  </span>
                  <span v-if="match.teams[0]" class="team-score">
                    {{ match.result.team1Score !== null ? match.result.team1Score : '-' }}
                  </span>
                </div>
                <div
                  class="team"
                  :class="{
                    'winner': match.winner === 1,
                    'empty': !match.teams[1]
                  }"
                >
                  <span class="team-name">
                    {{ match.teams[1]?.username || 'TBD' }}
                  </span>
                  <span v-if="match.teams[1]" class="team-score">
                    {{ match.result.team2Score !== null ? match.result.team2Score : '-' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';

const props = defineProps({
  competitionId: {
    type: String,
    required: true
  }
});

const loading = ref(true);
const rounds = ref([]);
const knockoutFixtures = ref([]);

const roundOrderMap = {
  roundOf64: 6,
  roundOf32: 5,
  roundOf16: 4,
  quarterFinal: 3,
  semiFinal: 2,
  final: 1
};

const fetchKnockoutFixtures = async () => {
  try {
    const response = await api.get(`/tournament/${props.competitionId}/knockoutFixtures`);
    knockoutFixtures.value = response.data.filter(fixture => !fixture.round.toLowerCase().includes('reverse'));
  } catch (error) {
    console.error('Error fetching knockout fixtures:', error);
  }
};

const initializeTournament = () => {
  const groupedFixtures = {};
  let maxRounds = 1; // Default to at least 1 round

  // Group fixtures by round and determine max rounds
  knockoutFixtures.value.forEach(fixture => {
    const roundName = fixture.round;
    const roundNumber = roundOrderMap[roundName] || 1; // Default to 1 if unrecognized
    maxRounds = Math.max(maxRounds, roundNumber);

    if (!groupedFixtures[roundNumber]) groupedFixtures[roundNumber] = [];
    groupedFixtures[roundNumber].push(fixture);
  });

  // Create the tournament rounds structure
  rounds.value = Array.from({ length: maxRounds }, (_, roundIndex) => {
    const roundMatches = groupedFixtures[maxRounds - roundIndex] || [];
    const matchesInRound = Math.pow(2, maxRounds - roundIndex - 1); // Ensures proper bracket size

    return Array.from({ length: matchesInRound }, (__, matchIdx) => {
      const existingFixture = roundMatches[matchIdx];

      return {
        id: existingFixture?._id || `round${roundIndex + 1}-match${matchIdx + 1}`,
        teams: [
          existingFixture?.team1 || null,
          existingFixture?.team2 || null
        ],
        result: existingFixture?.result || { team1Score: null, team2Score: null },
        winner: existingFixture?.status === 'completed'
          ? (existingFixture.result.team1Score > existingFixture.result.team2Score ? 0 : 1)
          : null
      };
    });
  });
};

onMounted(async () => {
  await fetchKnockoutFixtures();
  initializeTournament();
  loading.value = false;
});
</script>

<style scoped>
.tournament-bracket-container {
  width: 100%;
  overflow-x: auto;
}

.bracket {
  display: flex;
  justify-content: space-between;
  width: 100%;
  min-width: 700px;
}

.round {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 200px;
}

.matches {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
}

.match {
  position: relative;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.match-teams {
  display: flex;
  flex-direction: column;
}

.team {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #f0f0f0;
}

.team.empty {
  opacity: 1.0;
  font-style: italic;
}

.team:last-child {
  border-bottom: none;
}

.team-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-score {
  width: 40px;
  text-align: center;
  font-weight: bold;
  background-color: #6b4f4f;
  padding: 1px;
  border-radius: 2px;
  border: 1px solid #e0e0e0;
}

.winner {
  background-color: #3a0513;
}

.match-top::before,
.match-bottom::before {
  content: '';
  position: absolute;
  border-top: 1px solid #e0e0e0;
  width: 20px;
  right: -20px;
  top: 25%;
}

.match-top::before {
  top: 25%;
}

.match-bottom::before {
  top: 75%;
}
</style>
