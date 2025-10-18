<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <!-- Back button to return to the previous page -->
      <q-btn flat round icon="arrow_back" @click="router.go(-1)" color="white" />
    </q-toolbar>

    <!-- Competition Name -->
    <div class="q-px-md q-pb-sm row items-center">
      <div class="text-h6 text-weight-bold">
        {{ competitionName }}
      </div>
    </div>

    <!-- Tabs for navigation -->
    <q-tabs
      v-model="currentTab"
      class="text-white"
      indicator-color="secondary"
      align="justify"
    >
      <q-tab
       v-if="status === 'draft'"
       name="mainTab"
       :label="isAdmin ? (competitionType === 'league' ? 'Edit League' : 'Edit Tournament') : 'Details'"
      />

      <q-tab
        v-if="status === 'draft'"
        name="members"
        label="Members"
      />

      <!-- Table Tab (visible when the competition is ongoing or completed) -->
      <q-tab
        v-if="status === 'ongoing' || status === 'completed'"
        name="table"
        label="Table"
      />

      <q-tab
      v-if="(status === 'ongoing' || status === 'completed') && stage === 'knockout'"
        name="knockout"
        label="Knockout"
      />

      <!-- Fixtures Tab (visible when the competition is ongoing or completed) -->
      <q-tab
        v-if="status === 'ongoing' || status === 'completed'"
        name="fixtures"
        label="Fixtures"
      />

      <!-- Stats Tab (visible when the competition is ongoing or completed) -->
      <q-tab
        v-if="status === 'ongoing' || status === 'completed'"
        name="stats"
        label="Stats"
      />
    </q-tabs>
  </q-header>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, watch, onMounted } from "vue";

const router = useRouter();
const props = defineProps({
  competitionName: { type: String },
  initialTab: { type: String, default: "" },
  status: { type: String },
  stage: { type: String },
  competitionType: String,
  isAdmin: Boolean,
});

const emit = defineEmits(["tab-change"]);
const currentTab = ref(props.initialTab);

// Watch for tab changes and emit to parent component
watch(currentTab, (newTab) => {
  emit("tab-change", newTab);
});


// Set default tab based on status and competition type
onMounted(() => {
  if (!currentTab.value) {
    // Logic to set the default tab
    if (props.status === "draft") {
      currentTab.value = "mainTab";
    } else if (props.status === "ongoing" || props.status === "completed") {
      currentTab.value = "table";
    }
  }
});
</script>
