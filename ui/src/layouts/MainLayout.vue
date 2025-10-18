<template>
  <q-layout view="hHh LpR fFf">
    <!-- Header -->
    <q-header v-if="currentRouteName !== 'profile'">
      <q-toolbar class="q-py-sm">
        <template v-if="currentRouteName === 'matches'">
          <div class="logo-container q-mr-sm">
            <q-img src="/favicon.ico" width="60px" height="60px" />
          </div>
          <q-toolbar-title class="text-h5">Second Striker</q-toolbar-title>
          <!-- Matches page actions -->
          <div class="row items-center q-gutter-x-md">
            <q-btn
            flat round dense
            icon="how_to_reg"
            unelevated
            @click="showRequestsModal = true"
            />
            <RequestsModal v-model="showRequestsModal" />
          </div>
        </template>

        <template v-else-if="currentRouteName === 'leagues'">
          <q-toolbar-title class="text-h5">{{ pageTitle }}</q-toolbar-title>
        </template>

        <template v-else>
          <q-toolbar-title class="text-h5">{{ pageTitle }}</q-toolbar-title>
        </template>
      </q-toolbar>
    </q-header>

    <!-- Main Content Area with QPageContainer -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Bottom Navigation -->
    <q-footer class="bg-navbar">
      <q-tabs no-caps active-color="secondary" indicator-color="secondary" v-model="currentTab" class="text-grey-5">
        <q-route-tab name="matches" to="/" icon="sports" label="Matches" />
        <q-route-tab name="tournaments" to="/tournaments" icon="emoji_events" label="Tournaments" />
        <q-route-tab name="leagues" to="/leagues" icon="sports_soccer" label="Leagues" />
        <q-route-tab name="profile" to="/profile" icon="person" label="Profile" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import RequestsModal from '../components/RequestsModal.vue'

const route = useRoute()
const currentTab = ref('matches')
const currentRouteName = computed(() => route.name)
const showRequestsModal = ref(false)

const pageTitle = computed(() => {
  switch (currentRouteName.value) {
    case 'leagues': return 'Leagues'
    case 'tournaments': return 'Tournaments'
    default: return ''
  }
})

</script>

<style lang="scss">
.q-toolbar {
  min-height: 60px;
}

</style>
