<template>
  <div v-if="!loading">
    <CompetitionHeader
      :competitionName="competitionDetails.name || ''"
      @tab-change="handleTabChange"
      :initialTab="currentTab"
      :competitionType="competitionType"
      :status="competitionDetails.status"
      :is-admin="isAdmin"
      :stage="competitionDetails.stage"
    />
    <!-- Other page content -->
    <q-page padding>
      <div v-if="currentTab === 'mainTab' && !isCompetitionOngoing">
        <DynamicEdit
          v-if="isAdmin"
          :competition-details="competitionDetails"
          :is-admin="isAdmin"
          @tournament-started="updateCompetitionStatus"
        />
        <DynamicDetails
          v-else
          :competition-details="competitionDetails"
        />
      </div>

      <div v-else-if="currentTab === 'members' && !isCompetitionOngoing">
        <MembersList :members="competitionDetails.members" :competitionType="competitionType" />
      </div>

      <div v-else-if="currentTab === 'table' && isCompetitionOngoing">
        <DynamicTable :competitionId="competitionId" :isAdmin="isAdmin" />
      </div>

      <div v-else-if="currentTab === 'knockout' && isCompetitionOngoing">
        <TournamentBracket :competitionId="competitionId" :isAdmin="isAdmin" />
      </div>

      <div v-else-if="currentTab === 'fixtures' && isCompetitionOngoing">
        <DynamicFixtures
        :competitionId="competitionId"
        :stage="competitionDetails.stage"
        :isAdmin="isAdmin"
        @tournament-started="updateCompetitionStatus"
        />
      </div>

      <div v-else-if="currentTab === 'stats' && isCompetitionOngoing">
        <DynamicStats :competitionId="competitionId" />
      </div>
    </q-page>
  </div>

  <div v-else class="column items-center q-pa-lg">
    <q-spinner-dots size="40px" color="primary" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "stores/auth";
import { defineAsyncComponent } from 'vue';

import { useCompetitionsStore } from "src/stores/competition";
import CompetitionHeader from "src/components/CompetitionHeader.vue";
import MembersList from "src/components/MembersList.vue";
import TournamentBracket from "src/components/TournamentBracket.vue";

// Reactive references
const loading = ref(false);
const competitionDetails = ref({});
const currentTab = ref();
const isCompetitionOngoing = ref(false);
const isAdmin = ref(false);

// Route and store setup
const route = useRoute();
const competitionId = route.params.competitionId;
const competitionType = route.params.type;
const competitionStore = useCompetitionsStore();
const authStore = useAuthStore();

onMounted(async () => {
  loading.value = true;

  try {
    await competitionStore.fetchCompetitionById(competitionId, competitionType);

    const fetchedData = competitionStore.specificCompetition;

    if (fetchedData.league) {
      competitionDetails.value = fetchedData.league;
    } else if (fetchedData.tournament) {
      competitionDetails.value = fetchedData.tournament;
    } else {
      console.error("Unknown competition type structure:", fetchedData);
    }

    updateStatusAndAdmin();
  } catch (err) {
    console.error("Failed to fetch competition data:", err);
  } finally {
    loading.value = false;
  }
});

function updateStatusAndAdmin() {
  const status = competitionDetails.value.status;
  isCompetitionOngoing.value = status === "ongoing";

  const creatorId = competitionDetails.value.creator?._id;
  isAdmin.value = authStore.checkIfAdmin(creatorId);
}

watch(competitionDetails, () => {
  updateStatusAndAdmin();
});

// Mapping of competitionType to components
const componentMap = {
  league: {
    Edit: () => import("/src/components/LeagueEdit.vue"),
    Details: () => import("/src/components/LeagueDetails.vue"),
    Table: () => import("/src/components/LeagueTable.vue"),
    Fixtures: () => import("/src/components/LeagueFixtures.vue"),
    Stats: () => import("/src/components/LeagueStats.vue"),
  },
  tournament: {
    Edit: () => import("/src/components/TournamentEdit.vue"),
    Details: () => import("/src/components/TournamentDetails.vue"),
    Table: () => import("/src/components/TournamentTable.vue"),
    Fixtures: () => import("/src/components/TournamentFixtures.vue"),
    Stats: () => import("/src/components/TournamentStats.vue"),
  },
};

// Use the map to load components dynamically
const DynamicEdit = defineAsyncComponent(componentMap[competitionType].Edit);
const DynamicDetails = defineAsyncComponent(componentMap[competitionType].Details);
const DynamicTable = defineAsyncComponent(componentMap[competitionType].Table);
const DynamicFixtures = defineAsyncComponent(componentMap[competitionType].Fixtures);
const DynamicStats = defineAsyncComponent(componentMap[competitionType].Stats);

function handleTabChange(newTab) {
  currentTab.value = newTab;
}

function updateCompetitionStatus() {
  // Update the status in the store or trigger a refetch
  competitionStore.fetchCompetitionById(competitionId, competitionType).then(() => {
    const fetchedData = competitionStore.specificCompetition;

    if (fetchedData.league) {
      competitionDetails.value = fetchedData.league;
    } else if (fetchedData.tournament) {
      competitionDetails.value = fetchedData.tournament;
    }

    // Ensure the tab switches to table
    currentTab.value = 'table';
  });
}
</script>

