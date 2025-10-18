<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Loading state -->
      <div v-if="loading" class="column items-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
        <div class="text-grey-7 q-mt-sm">Loading leagues...</div>
      </div>

      <!-- Leagues list -->
      <div v-else-if="leagues.length" class="row q-col-gutter-md">
        <div v-for="league in leagues" :key="league._id" class="col-12">
          <q-card clickable @click="navigateToCompetition('league', league._id)">
            <q-card-section>
              <div class="row items-center">
                <q-avatar
                  :color="getRandomColor(league._id)"
                  size="40px"
                  class="q-mr-md"
                >
                  <q-icon name="emoji_events" size="24px" />
                </q-avatar>
                <div>
                  <div class="text-h6">{{ league.name }}</div>
                  <div class="text-subtitle2">
                    Admin: {{ league.creator.username }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center q-pa-lg text-grey-7">
        You are not in any league. Create or join a league.
      </div>
    </div>

    <FabButton
      icon="add"
      color="secondary"
      :action="() => {
        showDialog = true;
      }"
    />

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px; border-radius: 20px">
        <q-card-section>
          <div class="text-h6">League name</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="leagueName"
            label="Title"
            :rules="[val => !!val || 'League name is required']"
            class="q-mb-md"
            :error="!!formError"
            :error-message="formError"
          />
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">League Fee:</div>
            <div class="row items-center">
              <q-input
                v-model="leagueFee"
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
                  :disable="parseFloat(leagueFee) <= 0"
                />
                <q-btn
                  flat
                  dense
                  icon="add"
                  @click="incrementFee"
                  :disable="parseFloat(leagueFee) >= 999.99"
                />
              </q-btn-group>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Create League"
            color="secondary"
            @click="createLeague"
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
import { api } from "boot/axios"; // Axios instance
import { getRandomColor } from "src/utils/getRandomColor"; // Utility for avatar colors
import FabButton from "components/FabButton.vue"; // Floating Action Button component

const router = useRouter();

// Store access
const competitionsStore = useCompetitionsStore();
const leagues = computed(() => competitionsStore.competitions.leagues);
const loading = ref(false); 

// Form variables
const showDialog = ref(false);
const leagueName = ref("");
const leagueFee = ref("0.00");
const isLoading = ref(false);
const formError = ref("");

// Lifecycle hook: Fetch leagues on mount
onMounted(async () => {
  loading.value = true;
  try {
    await competitionsStore.fetchCompetitions("league");
  } finally {
    loading.value = false;
  }
});

// Increment and decrement fee helpers
const incrementFee = () => {
  let currentFee = parseFloat(leagueFee.value);
  if (currentFee < 999.99) {
    currentFee = Math.min(999.99, currentFee + 5);
    leagueFee.value = currentFee.toFixed(2);
  }
};

const decrementFee = () => {
  let currentFee = parseFloat(leagueFee.value);
  if (currentFee > 0) {
    currentFee = Math.max(0, currentFee - 5);
    leagueFee.value = currentFee.toFixed(2);
  }
};

// Close dialog and reset form
const closeDialog = () => {
  showDialog.value = false;
  leagueName.value = "";
  leagueFee.value = "0.00";
  formError.value = "";
};

// Create league action
const createLeague = async () => {
  if (!leagueName.value || leagueFee.value === "") {
    formError.value = "Please fill in all required fields";
    return;
  }

  isLoading.value = true;
  formError.value = "";

  try {
    await api.post("/league/create", {
      name: leagueName.value,
      fee: parseFloat(leagueFee.value),
    });

    // Refresh leagues after creation
    await competitionsStore.fetchCompetitions("league");
    closeDialog();
  } catch (error) {
    console.error("Error creating league:", error);
    formError.value =
      error.response?.data?.message || "Error creating league. Please try again.";
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

<style scoped>
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 10;
}
</style>
