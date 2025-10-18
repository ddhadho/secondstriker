<template>
  <q-page class="q-pa-md">
    <div class="column items-start q-gutter-y-md">
      <div class="username-display">
        {{ username }}
      </div>
      <q-btn flat dense icon="account_balance_wallet" @click="goToWallet">
        <div class="q-ml-sm">Wallet</div>
      </q-btn>
      <q-btn flat dense icon="bar_chart">
        <div class="q-ml-sm">Stats</div>
      </q-btn>
      <q-btn flat dense icon="logout" @click="logout">
        <div class="q-ml-sm">Logout</div>
      </q-btn>
      <q-btn flat dense icon="settings">
        <div class="q-ml-sm">Settings</div>
      </q-btn>
    </div>
  </q-page>
</template>

<script setup>
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const authStore = useAuthStore();
const router = useRouter();

const username = authStore.username;


function goToWallet() {
  router.push({ name: 'wallet' });
}

function logout() {
  authStore.logout();
  router.push({ name: 'login' }); 
}

// Optional: Initialize store on mounted
onMounted(() => {
  authStore.initializeStore();
});
</script>

<style scoped>
/* Add any custom styles here */
</style>
