<!-- src/layouts/AuthLayout.vue -->
<template>
  <q-layout view="lHh LpR lff">
    <q-page-container>
      <q-page class="full-page-auth" padding>
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
// No additional setup needed; this layout is minimal.
</script>

<style scoped>
.full-page-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5; /* Optional: change for specific branding */
}
</style>
