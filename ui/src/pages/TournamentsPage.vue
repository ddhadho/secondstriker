<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Loading state -->
      <div v-if="loading" class="column items-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
        <div class="text-grey-7 q-mt-sm">Loading tournaments...</div>
      </div>

      <!-- Tournaments list -->
      <div v-else-if="tournaments && tournaments.length" class="row q-col-gutter-md">
        <div v-for="tournament in tournaments" :key="tournament._id" class="col-12">
          <q-card clickable @click="navigateToCompetition('tournament', tournament._id)">
            <q-card-section>
              <div class="row items-center">
                <q-avatar
                  :color="getRandomColor(tournament._id)"
                  size="40px"
                  class="q-mr-md"
                >
                  <q-icon name="sports_esports" size="24px" />
                </q-avatar>
                <div>
                  <div class="text-h6">{{ tournament.name }}</div>
                  <div class="text-subtitle2">
                    Admin: {{ tournament.creator.username }}
                  </div>
                  <div class="text-subtitle2">
                    {{ formatDisplay(tournament.format) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center q-pa-lg text-grey-7">
        No tournaments available. Create or join a tournament.
      </div>
    </div>

    <FabButton
      icon="add"
      color="secondary"
      :action="() => (showDialog = true)"
    />

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px; border-radius: 20px">
        <q-card-section>
          <div class="text-h6">Create Tournament</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="tournamentName"
            label="Tournament Name"
            :rules="[val => !!val || 'Tournament name is required']"
            class="q-mb-md"
            :error="!!formError"
            :error-message="formError"
          />

          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Tournament Format:</div>
            <q-btn-group spread>
              <q-btn
                :color="tournamentType === 'groupKnockout' ? 'secondary' : 'grey-5'"
                label="Group Stage + Knockout"
                @click="tournamentType = 'groupKnockout'"
              />
              <q-btn
                :color="tournamentType === 'knockout' ? 'secondary' : 'grey-5'"
                label="Knockout"
              />
            </q-btn-group>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Tournament Fee:</div>
            <div class="row items-center">
              <q-input
                v-model="tournamentFee"
                outlined
                dense
                mask="#.##"
                fill-mask="0"
                reverse-fill-mask
                input-class="text-right"
                style="width: 120px"
                class="q-mr-sm"
                :rules="[
                  val => !!val || 'Required',
                  val => parseFloat(val) >= 5 || 'Min 5',
                  val => parseFloat(val) <= 999.99 || 'Max 999.99'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_money" />
                </template>
              </q-input>
              <q-btn-group flat>
                <q-btn
                  flat
                  dense
                  icon="remove"
                  @click="decrementFee"
                  :disable="parseFloat(tournamentFee) <= 0"
                />
                <q-btn
                  flat
                  dense
                  icon="add"
                  @click="incrementFee"
                  :disable="parseFloat(tournamentFee) >= 999.99"
                />
              </q-btn-group>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Create Tournament"
            color="secondary"
            @click="createTournament"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useCompetitionsStore } from "src/stores/competition";
import { ref, onMounted, computed } from "vue";
import { api } from "boot/axios";
import { getRandomColor } from "src/utils/getRandomColor";
import FabButton from "components/FabButton.vue";

const router = useRouter();
const competitionsStore = useCompetitionsStore();

// Data variables
const showDialog = ref(false);
const tournamentName = ref("");
const tournamentType = ref("groupKnockout");
const tournamentFee = ref("0.00");
const isLoading = ref(false);
const formError = ref("");

// Computed for tournaments
const tournaments = computed(() => competitionsStore.competitions.tournaments);
const loading = ref(false);

// Lifecycle hook: Fetch tournaments on mount
onMounted(async () => {
  loading.value = true;
  try {
    await competitionsStore.fetchCompetitions("tournament");
  } finally {
    loading.value = false;
  }
});
// Helpers for display
const formatDisplay = (format) => {
  return format === "groupKnockout" ? "Group Stage + Knockout" : "Knockout";
};

// Fee increment/decrement helpers
const incrementFee = () => {
  let currentFee = parseFloat(tournamentFee.value);
  if (currentFee < 999.99) {
    currentFee = Math.min(999.99, currentFee + 5);
    tournamentFee.value = currentFee.toFixed(2);
  }
};

const decrementFee = () => {
  let currentFee = parseFloat(tournamentFee.value);
  if (currentFee > 0) {
    currentFee = Math.max(0, currentFee - 5);
    tournamentFee.value = currentFee.toFixed(2);
  }
};

// Reset form
const closeDialog = () => {
  showDialog.value = false;
  tournamentName.value = "";
  tournamentType.value = "groupKnockout";
  tournamentFee.value = "0.00";
  formError.value = "";
};

// Create tournament action
const createTournament = async () => {
  if (!tournamentName.value || tournamentFee.value === "") {
    formError.value = "Please fill in all required fields";
    return;
  }

  isLoading.value = true;
  formError.value = "";

  try {
    await api.post("/tournament/create", {
      name: tournamentName.value,
      format: tournamentType.value,
      fee: parseFloat(tournamentFee.value),
    });

    await competitionsStore.fetchCompetitions("tournament");
    closeDialog();
  } catch (error) {
    console.error("Error creating tournament:", error);
    formError.value =
      error.response?.data?.message ||
      "Error creating tournament. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const navigateToCompetition = (type, competitionId) => {
  const validTypes = ['league', 'tournament'];
  if (!validTypes.includes(type)) {
    console.error('Invalid competition type:', type);
    return;
  }

  router.push({
    name: 'competition',
    params: { type, competitionId },
  });
};

</script>
