<template>
  <div class="fixtures-container">
    <div v-if="loading" class="flex flex-center q-pa-sm">
      <q-spinner-dots size="50px" color="primary" />
    </div>
    <div v-else class="q-gutter-y-sm">
      <!-- Group Stage Fixtures -->
      <q-card
        v-for="(roundFixtures, round) in groupedFixtures"
        :key="round"
        class="gameweek-card"
      >
        <q-card-section class="text-center q-pb-xs q-pt-sm">
          <div class="text-h6">Gameweek {{ round }}</div>
        </q-card-section>
        <q-card-section class="q-pa-sm">
          <q-list>
            <q-item v-for="fixture in roundFixtures" :key="fixture._id" class="fixture-item">
              <q-item-section>
                <div class="row items-center justify-center fixture-teams q-py-none">
                  <div class="col-auto text-right team-section">
                    {{ fixture.team1.username }}
                    <template v-if="isAdmin && !fixture.status.completed">
                      <q-input
                        v-model="fixture.result.team1Score"
                        type="text"
                        dense
                        class="score-input"
                        maxlength="2"
                        @update:model-value="validateScore($event, fixture, 'team1Score')"
                      />
                    </template>
                  </div>
                  <div class="col-auto q-px-sm">
                    <template v-if="fixture.status === 'completed' && !isAdmin">
                      <q-chip dense color="grey-7" text-color="white">
                        {{ fixture.result.team1Score }} - {{ fixture.result.team2Score }}
                      </q-chip>
                    </template>
                    <template v-else>
                      <q-badge color="primary" class="vs-badge">VS</q-badge>
                    </template>
                  </div>
                  <div class="col-auto text-left team-section">
                    <template v-if="isAdmin && !fixture.status.completed">
                      <q-input
                        v-model="fixture.result.team2Score"
                        type="text"
                        dense
                        class="score-input"
                        maxlength="2"
                        @update:model-value="validateScore($event, fixture, 'team2Score')"
                      />
                    </template>
                    {{ fixture.team2.username }}
                  </div>
                </div>
                <div v-if="isAdmin && !fixture.status.completed && isScoreValid(fixture)" class="row items-center justify-center q-mt-sm">
                  <q-btn
                    color="primary"
                    label="Save Result"
                    dense
                    @click="updateFixtureResult(fixture)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Knockout Fixtures -->
      <q-card
        v-for="(knockoutRound, round) in groupedKnockoutFixtures"
        :key="round"
        class="knockout-card"
      >
        <q-card-section class="text-center q-pb-xs q-pt-sm">
          <div class="text-h6">{{ round }}</div>
        </q-card-section>
        <q-card-section class="q-pa-sm">
          <q-list>
            <!-- Leg 1 Fixtures -->
            <div v-if="knockoutRound.leg1.length">
              <q-item-label header class="text-bold">Leg 1</q-item-label>
              <q-item v-for="fixture in knockoutRound.leg1" :key="fixture._id" class="fixture-item">
                <q-item-section>
                  <div class="row items-center justify-center fixture-teams">
                    <div class="col-auto text-right team-section">
                      {{ fixture.team1.username }}
                      <template v-if="isAdmin && !fixture.status.completed">
                        <q-input
                          v-model="fixture.result.team1Score"
                          type="text"
                          dense
                          class="score-input"
                          maxlength="2"
                          @update:model-value="validateScore($event, fixture, 'team1Score')"
                        />
                      </template>
                    </div>
                    <div class="col-auto q-px-sm">
                      <template v-if="fixture.status === 'completed' && !isAdmin">
                        <q-chip dense color="grey-7" text-color="white">
                          {{ fixture.result.team1Score }} - {{ fixture.result.team2Score }}
                        </q-chip>
                      </template>
                      <template v-else>
                        <q-badge color="primary" class="vs-badge">VS</q-badge>
                      </template>
                    </div>
                    <div class="col-auto text-left team-section">
                      <template v-if="isAdmin && !fixture.status.completed">
                        <q-input
                          v-model="fixture.result.team2Score"
                          type="text"
                          dense
                          class="score-input"
                          maxlength="2"
                          @update:model-value="validateScore($event, fixture, 'team2Score')"
                        />
                      </template>
                      {{ fixture.team2.username }}
                    </div>
                  </div>
                  <div v-if="isAdmin && !fixture.status.completed && isScoreValid(fixture)" class="row items-center justify-center q-mt-sm">
                    <q-btn
                      color="primary"
                      label="Save Result"
                      dense
                      @click="knockoutFixtureUpdate(fixture)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </div>

            <!-- Leg 2 Fixtures -->
            <div v-if="knockoutRound.leg2.length">
              <q-item-label header class="text-bold">Leg 2</q-item-label>
              <q-item v-for="fixture in knockoutRound.leg2" :key="fixture._id" class="fixture-item">
                <q-item-section>
                  <div class="row items-center justify-center fixture-teams">
                    <div class="col-auto text-right team-section">
                      {{ fixture.team1.username }}
                      <template v-if="isAdmin && !fixture.status.completed">
                        <q-input
                          v-model="fixture.result.team1Score"
                          type="text"
                          dense
                          class="score-input"
                          maxlength="2"
                          @update:model-value="validateScore($event, fixture, 'team1Score')"
                        />
                      </template>
                    </div>
                    <div class="col-auto q-px-sm">
                      <template v-if="fixture.status === 'completed' && !isAdmin">
                        <q-chip dense color="grey-7" text-color="white">
                          {{ fixture.result.team1Score }} - {{ fixture.result.team2Score }}
                        </q-chip>
                      </template>
                      <template v-else>
                        <q-badge color="primary" class="vs-badge">VS</q-badge>
                      </template>
                    </div>
                    <div class="col-auto text-left team-section">
                      <template v-if="isAdmin && !fixture.status.completed">
                        <q-input
                          v-model="fixture.result.team2Score"
                          type="text"
                          dense
                          class="score-input"
                          maxlength="2"
                          @update:model-value="validateScore($event, fixture, 'team2Score')"
                        />
                      </template>
                      {{ fixture.team2.username }}
                    </div>
                  </div>
                  <div v-if="isAdmin && !fixture.status.completed && isScoreValid(fixture)" class="row items-center justify-center q-mt-sm">
                    <q-btn
                      color="primary"
                      label="Save Result"
                      dense
                      @click="knockoutFixtureUpdate(fixture)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </div>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineEmits } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

/* -----------------------
   REQUIRED FIXED IMPORTS
-------------------------*/
const $q = useQuasar()

/* -----------------------
   PROPS
-------------------------*/
const props = defineProps({
  competitionId: { type: String, required: true },
  isAdmin: { type: Boolean, required: true },
  stage: { type: String, required: true }
})

/* -----------------------
   STATE
-------------------------*/
const fixtures = ref([])
const knockoutFixtures = ref([])
const loading = ref(true)
const currentRound = ref(1)
const emit = defineEmits(['tournament-started'])

/* -----------------------
   ADDED: winnerInfo
-------------------------*/
const winnerInfo = ref({
  winner: '',
  firstPlacePrize: 0,
  runnerUp: '',
  secondPlacePrize: 0
})

/* -----------------------
   ADDED: formatCurrency
-------------------------*/
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

/* -----------------------
   FETCH FIXTURES
-------------------------*/
async function fetchFixtures() {
  try {
    const response = await api.get(`/tournament/${props.competitionId}/fixtures`)
    fixtures.value = response.data

    const playedFixtures = fixtures.value.filter(f => f.completed)
    if (playedFixtures.length > 0) {
      currentRound.value = Math.max(...playedFixtures.map(f => f.round))
    }
  } catch (error) {
    console.error('Error fetching fixtures:', error)
  } finally {
    loading.value = false
  }
}

async function fetchKnockoutFixtures() {
  try {
    const response = await api.get(`/tournament/${props.competitionId}/knockoutFixtures`)
    knockoutFixtures.value = response.data.filter(f => f.team1 && f.team2)
  } catch (error) {
    console.error('Error fetching knockout fixtures:', error)
  } finally {
    loading.value = false
  }
}

/* -----------------------
   COMPUTED
-------------------------*/
const groupedFixtures = computed(() => {
  return fixtures.value.reduce((groups, fixture) => {
    if (!groups[fixture.round]) groups[fixture.round] = []
    groups[fixture.round].push(fixture)
    return groups
  }, {})
})

const groupedKnockoutFixtures = computed(() => {
  return knockoutFixtures.value.reduce((groups, fixture) => {
    const round = fixture.round.toLowerCase()
    const isReverse = round.includes("reverse")
    const baseRound = isReverse ? round.replace("reverse", "").trim() : round

    if (!groups[baseRound]) groups[baseRound] = { leg1: [], leg2: [] }
    isReverse ? groups[baseRound].leg2.push(fixture) : groups[baseRound].leg1.push(fixture)

    return groups
  }, {})
})

/* -----------------------
   SCORE VALIDATION
-------------------------*/
function validateScore(value, fixture, field) {
  const numValue = parseInt(String(value).replace(/[^0-9]/g, ''))
  fixture.result[field] = isNaN(numValue) ? '' : numValue
}

function isScoreValid(fixture) {
  return (
    fixture.result.team1Score !== '' &&
    fixture.result.team2Score !== '' &&
    !isNaN(fixture.result.team1Score) &&
    !isNaN(fixture.result.team2Score)
  )
}

/* -----------------------
   UPDATE GROUP FIXTURE
-------------------------*/
async function updateFixtureResult(fixture) {
  try {
    loading.value = true
    await api.put(`/tournament/${props.competitionId}/updateFixtures/${fixture._id}`, {
      team1Score: fixture.result.team1Score,
      team2Score: fixture.result.team2Score
    })

    await fetchFixtures()
    await checkIfAllFixturesCompleted()

  } catch (error) {
    console.error('Error saving fixture result:', error)
  } finally {
    loading.value = false
  }
}

/* -----------------------
   NOTIFICATION FIXED
-------------------------*/
const showCompletionBanner = () => {
  $q.notify({
    type: 'positive',
    position: 'top',
    timeout: 5000,
    multiLine: true,
    html: true,
    message: `
      <div class="text-h6">Tournament Completed!</div>
      <div class="text-subtitle1">Winner: ${winnerInfo.value.winner}</div>
      <div class="text-caption">Prize: ${formatCurrency(winnerInfo.value.firstPlacePrize)}</div>
      <div class="text-subtitle2">Runner Up: ${winnerInfo.value.runnerUp}</div>
      <div class="text-caption">Prize: ${formatCurrency(winnerInfo.value.secondPlacePrize)}</div>
    `
  })
}

/* -----------------------
   UPDATE KNOCKOUT FIXTURE
-------------------------*/
const knockoutFixtureUpdate = async (fixture) => {
  if (!isScoreValid(fixture)) return

  try {
    loading.value = true

    // FINAL MATCH
    if (fixture.round.toLowerCase() === 'final') {
      const fixtureDetails = {
        fixtureId: fixture._id,
        team1Score: fixture.result.team1Score,
        team2Score: fixture.result.team2Score
      }

      const winnerData = await finishTournament(fixtureDetails)
      await fetchKnockoutFixtures()

      if (winnerData) {
        winnerInfo.value = {
          winner: winnerData.winner,
          firstPlacePrize: winnerData.firstPlacePrize,
          runnerUp: winnerData.runnerUp || '',
          secondPlacePrize: winnerData.secondPlacePrize || 0
        }
        showCompletionBanner()
      }

      return
    }

    // NORMAL MATCH
    await api.put(`/tournament/${props.competitionId}/updateKnockoutFixtures/${fixture._id}`, {
      team1Score: fixture.result.team1Score,
      team2Score: fixture.result.team2Score
    })

    await fetchKnockoutFixtures()

  } catch (error) {
    console.error('Error updating fixture:', error)
  } finally {
    loading.value = false
  }
}

/* -----------------------
   FINISH TOURNAMENT
-------------------------*/
async function finishTournament(fixtureDetails) {
  try {
    const response = await api.post(`tournament/${props.competitionId}/finish`, fixtureDetails)
    return response.data
  } catch (error) {
    console.error('Error finishing tournament:', error)
    return null
  }
}

/* -----------------------
   CHECK GROUP COMPLETION
-------------------------*/
async function checkIfAllFixturesCompleted() {
  try {
    const response = await api.get(`/tournament/${props.competitionId}/fixturesComplete`)

    if (
      response.data.message === 'All group stage fixtures are completed' &&
      props.stage === 'groupStage'
    ) {
      await startKnockoutStages()
      await fetchKnockoutFixtures()
    }
  } catch (error) {
    console.error('Error checking fixtures:', error)
  }
}

/* -----------------------
   START KNOCKOUT STAGE
-------------------------*/
async function startKnockoutStages() {
  try {
    const response = await api.post(`/tournament/${props.competitionId}/startKnockout`)

    if (response.status === 200) {
      await fetchKnockoutFixtures()
      emit('tournament-started')
    }
  } catch (error) {
    console.error('Error starting knockout stages:', error)
  }
}

/* -----------------------
   MOUNT
-------------------------*/
onMounted(() => {
  fetchFixtures()
  fetchKnockoutFixtures()
  checkIfAllFixturesCompleted()
})
</script>


<style lang="scss" scoped>
.fixtures-container {
  max-width: 900px;
  margin: 0 auto;
}

.gameweek-card {
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.fixture-item {
  min-height: 40px;
  padding: 4px 8px;
  &:hover {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }
}

.fixture-teams {
  font-weight: 500;
}

.team-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vs-badge {
  padding: 2px 6px;
  font-size: 0.75em;
}

.score-input {
  width: 32px;
  margin: 0;

  :deep(.q-field__native) {
    text-align: center;
    padding: 2px;
  }

  :deep(.q-field__control) {
    height: 32px;
  }

  :deep(.q-field__inner) {
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

:deep(.text-h6) {
  font-weight: 500;
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

:deep(.q-chip) {
  height: 24px;
}
</style>
