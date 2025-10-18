<template>
  <q-card class="league-stats-card">
    <q-card-section v-if="loading" class="text-center">
      <q-spinner-dots size="50px" color="primary" />
    </q-card-section>

    <q-card-section v-else>
      <div class="row q-col-gutter-md">
        <!-- Top Scorer Team -->
        <div class="col-12 col-sm-6">
          <q-card class="stat-box" flat bordered>
            <q-card-section>
              <div class="text-subtitle2">Goals Scored</div>
              <div v-if="stats.topScorerTeam" class="text-h6 q-mt-sm">
                {{ stats.topScorerTeam.name }}
                <div class="text-subtitle1">{{ stats.topScorerTeam.goalsFor }} goals</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Most Goals Conceded -->
        <div class="col-12 col-sm-6">
          <q-card class="stat-box" flat bordered>
            <q-card-section>
              <div class="text-subtitle2">Goals Conceded</div>
              <div v-if="stats.mostConcededTeam" class="text-h6 q-mt-sm">
                {{ stats.mostConcededTeam.name }}
                <div class="text-subtitle1">{{ stats.mostConcededTeam.goalsAgainst }} goals</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Goals per Match -->
        <div class="col-12 col-sm-6">
          <q-card class="stat-box" flat bordered>
            <q-card-section>
              <div class="text-subtitle2">Goals per Match</div>
              <div class="text-h6 q-mt-sm">
                {{ stats.goalsPerMatch }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Clean Sheets -->
        <div class="col-12 col-sm-6">
          <q-card class="stat-box" flat bordered>
            <q-card-section>
              <div class="text-subtitle2">Clean Sheets</div>
              <div v-if="stats.topCleanSheetTeam" class="text-h6 q-mt-sm">
                {{ stats.topCleanSheetTeam.name }}
                <div class="text-subtitle1">{{ stats.topCleanSheetTeam.count }} clean sheets</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';

const props = defineProps({
  leagueId: {
    type: String,
    required: true,
  },
});

const loading = ref(true);
const stats = ref({
  topScorerTeam: null,
  mostConcededTeam: null,
  goalsPerMatch: 0,
  cleanSheets: [],
  topCleanSheetTeam: null,
});

async function fetchLeagueStats() {
  try {
    const response = await api.get(`/league/${props.leagueId}/stats`);
    stats.value = response.data;
  } catch (error) {
    console.error('Error fetching league stats:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchLeagueStats);
</script>

<style scoped>
.league-stats-card {
  max-width: 800px;
  margin: 0 auto;
}

.stat-box {
  height: 100%;
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
