<template>
  <div class="q-gutter-md q-pa-md">
    <!-- Fixtures Section -->
    <div class="col-12">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 row items-center">
          <q-icon name="event" class="q-mr-sm" />
          Fixtures
          <q-btn
            flat
            color="secondary"
            label="Edit"
            class="q-ml-sm"
            @click="showFixturesDialog = true"
          />
        </div>
      </div>
      <q-dialog v-model="showFixturesDialog">
        <q-card style="width: 300px; border-radius: 30px;">
          <q-card-section>
            <div class="text-h6">Edit Fixtures</div>
          </q-card-section>
          <q-card-section>
            <q-option-group
              v-model="fixtureType"
              :options="fixtureOptions"
              type="radio"
              label="Select Fixture Type"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Save" color="secondary" @click="handleSaveFixtures" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <!-- Number of Teams Section -->
    <div class="col-12">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 row items-center">
          <q-icon name="group" class="q-mr-sm" />
          Number of teams
          <q-btn
            flat
            color="secondary"
            label="Edit"
            class="q-ml-sm"
            @click="showTeamsDialog = true"
          />
        </div>
      </div>
      <q-dialog v-model="showTeamsDialog">
        <q-card style="width: 300px; border-radius: 30px;">
          <q-card-section>
            <div class="text-h6">Edit Number of Teams</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model.number="numberOfTeams"
              type="number"
              label="Number of Teams"
              :rules="[minTeamsRule, maxTeamsRule]"
              filled
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Save" color="secondary" @click="handleSaveTeams" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <!-- Rules Section -->
    <div class="col-12">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 row items-center">
          <q-icon name="gavel" class="q-mr-sm" />
          Rules
          <q-btn
            flat
            color="secondary"
            label="Edit"
            class="q-ml-sm"
            @click="showRulesDialog = true"
          />
        </div>
      </div>
      <q-dialog v-model="showRulesDialog">
        <q-card style="width: 300px; border-radius: 30px;">
          <q-card-section>
            <div class="text-h6">Edit Rules</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="rules"
              type="textarea"
              label="League Rules"
              rows="4"
              filled
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Save" color="secondary" @click="handleRules" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <!-- Awards Section -->
    <div class="col-12">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 row items-center">
          <q-icon name="emoji_events" class="q-mr-sm" />
          Awards
          <q-btn
            flat
            color="secondary"
            label="Edit"
            class="q-ml-sm"
            @click="showAwardsDialog = true"
          />
        </div>
      </div>
      <q-dialog v-model="showAwardsDialog">
        <q-card style="width: 300px; border-radius: 30px;">
          <q-card-section>
            <div class="text-h6">Edit Awards</div>
          </q-card-section>
          <q-card-section>
            <q-option-group
              v-model="awards"
              :options="awardOptions"
              type="radio"
              label="Select Awards Distribution"
              @update:model-value="validateAwards"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Save" color="secondary" @click="handleAwards" :disable="!awards" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <!-- Add Teams Section -->
    <div class="col-12">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 row items-center">
          <q-icon name="sports_soccer" class="q-mr-sm" />
          Add Teams
          <q-btn
            flat
            color="secondary"
            label="Edit"
            class="q-ml-sm"
            @click="showAddTeamsDialog = true"
          />
        </div>
      </div>
      <q-dialog v-model="showAddTeamsDialog">
        <q-card style="width: 300px; border-radius: 30px;">
          <q-card-section>
            <div class="text-h6">Search and Add Teams</div>
          </q-card-section>
          <q-card-section>
            <q-select
              v-model="selectedTeam"
              :options="availableTeams"
              label="Search for a team"
              filled
              use-input
              input-debounce="300"
              @filter="filterTeams"
            />
            <q-btn
              label="Send Request"
              color="primary"
              flat
              @click="sendRequest"
              class="q-mt-sm"
              :disable="!selectedTeam"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Save" color="secondary" @click="showAddTeamsDialog = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <div class="absolute-bottom-right q-mb-md q-mr-md">
      <q-btn
        label="Start League"
        color="secondary"
        @click="startLeague"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import { api } from 'boot/axios';
import { useRoute } from "vue-router";
import { defineProps } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const leagueId = route.params.competitionId;
const emit = defineEmits(['tournament-started']);


const props = defineProps({
  competitionDetails: {
    type: Object,
    required: true,
  },
  isAdmin: Boolean,
});

const showFixturesDialog = ref(false);
const fixtureType = ref('');
const fixtureOptions = [
  { label: 'Home/Away', value: 'homeAway' },
  { label: 'Single Round', value: 'singleRound' }
];

async function handleSaveFixtures() {
  try {
    const response = await updateLeague({ fixtureType: fixtureType.value });
    if (response.status === 200) {
      $q.notify({
        type: 'positive',
        message: 'Fixtures updated!'
      });
      showFixturesDialog.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to update fixtures'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error saving fixtures',
      caption: error.message
    });
  }
}

const showTeamsDialog = ref(false);
const numberOfTeams = ref(3);
const minTeamsRule = (val) => val >= 3 || 'Minimum 3 teams required';
const maxTeamsRule = (val) => val <= 20 || 'Maximum 20 teams allowed';

async function handleSaveTeams() {
  try {
    const response = await updateLeague({ numberOfTeams: numberOfTeams.value });

    if (response.status === 200) {
      $q.notify({
        type: 'positive',
        message: 'Teams configuration updated!'
      });
      showTeamsDialog.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to update teams configuration'
      });    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error saving teams configuration',
      caption: error.message
    });  }
}

const showRulesDialog = ref(false);
const rules = ref('');

async function handleRules() {
  const rulesArray = rules.value
    .split('\n')
    .map((rule) => rule.trim())
    .filter((rule) => rule);

  try {
    await updateLeague({ rules: rulesArray });
    showRulesDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Rules updated!'
    });  } catch (error) {
      $q.notify({
      type: 'negative',
      message: 'Error saving rules',
      caption: error.response?.data?.error || error.message
    });
  }
}

const showAwardsDialog = ref(false);
const awards = ref('');
const awardOptions = [
  { label: '1st Place Only', value: 'first' },
  { label: '1st and 2nd Place', value: 'firstSecond' },
  { label: 'Top Three', value: 'topThree' },
];

function validateAwards(value) {
  if (!value) {
    $q.notify({
      type: 'warning',
      message: 'Awards option must be selected'
    });
  }
}

async function handleAwards() {
  if (!awards.value) {
    $q.notify({
      type: 'warning',
      message: 'Please select an awards option before saving'
    });
    return;
  }

  try {
    const response = await updateLeague({ awards: awards.value });
    if (response.status === 200) {
      $q.notify({
        type: 'positive',
        message: 'Awards updated!'
      });
      showAwardsDialog.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to update awards'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error saving awards',
      caption: error.response?.data?.error || error.message
    });
  }
}

const showAddTeamsDialog = ref(false);
const selectedTeam = ref(null);
const availableTeams = ref([]);

async function filterTeams(val, update) {
  update(async () => {
    if (!val) {
      availableTeams.value = [];
      return;
    }
    try {
      const response = await api.get('/league/search-user', {
        params: { username: val },
      });
      availableTeams.value = response.data.users.map((user) => ({
        label: user.username,
        value: user._id,
      }));
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error searching for user',
        caption: error.message
      });
      availableTeams.value = [];
    }
  });
}

async function sendRequest() {
  if (selectedTeam.value) {
    try {
      const response = await api.post('/league/invite', {
        leagueId: leagueId,
        userId: selectedTeam.value.value,
      });

      // Handle successful invitation with status codes 200 or 201
      if (response.status === 200 || response.status === 201) {
        selectedTeam.value = null; // Clear the selected team
        $q.notify({
          type: 'positive',
          message: 'Invite sent!'
        });
      } else {
        $q.notify({
          type: 'negative',
          message: 'Unexpected response from the server'
        });
      }
    } catch (error) {
      selectedTeam.value = null;
      // Distinguish between client and server errors
      if (error.response) {
        // The request was made, but the server responded with an error
        $q.notify({
          type: 'negative',
          message: 'Error sending invite',
          caption: error.response.data.message || 'Unknown error'
        });
      } else if (error.request) {
        // The request was made, but no response was received
        $q.notify({
          type: 'negative',
          message: 'No response from server',
          caption: 'Please check your connection or try again later'
        });
      } else {
        // Something went wrong in setting up the request
        $q.notify({
          type: 'negative',
          message: 'Error sending invite',
          caption: error.message
        });
      }
    }
  }
}

const isStartingLeague = ref(false);

async function startLeague() {

  if (!props.isAdmin) {
    $q.notify({
      type: 'warning',
      message: 'You are not authorized to start the league'
    });
    return;
  }
  if (props.competitionDetails.status !== 'draft') {
    $q.notify({
      type: 'warning',
      message: 'The league has already started or is completed'
    });
    return;
  }
  const expectedTeams = props.competitionDetails.numberOfTeams;
  if (props.competitionDetails.members.length !== props.competitionDetails.numberOfTeams) {
    $q.notify({
      type: 'warning',
      message: `You need exactly ${expectedTeams} teams to start the league`
    });
    return;
  }

  isStartingLeague.value = true;

  try {
    const response = await api.patch(`/league/start/${leagueId}`, {
      status: 'ongoing',
    });
    if (response.status === 200 ) {
      emit('tournament-started');    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error starting the league',
      caption: error.response?.data?.error || error.message,
    });
  }
}

async function updateLeague(updatedFields) {
  try {
    const response = await api.patch(`/league/update/${leagueId}`, updatedFields);
    return response;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error updating league',
      caption: error.response?.data?.error || error.message
    });
    throw error;
  }
}

</script>
