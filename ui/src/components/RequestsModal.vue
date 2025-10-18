<template>
  <q-dialog v-model="innerModalVisibility" persistent>
    <q-card class="requests-modal">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Requests</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeModal" />
      </q-card-section>
      <q-card-section class="q-pt-md">
        <div v-if="loading" class="text-center q-pa-md">Loading requests...</div>
        <div v-else-if="requests.length === 0" class="text-center q-pa-md">
          No pending requests
        </div>
        <q-list v-else>
          <q-item v-for="request in requests" :key="request.id" class="q-mb-sm">
            <q-item-section>
              <q-item-label>{{ request.name }} ({{ request.type }})</q-item-label>
              <q-item-label caption>
                Admin: {{ request.creator }} | Fee: {{ request.fee }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center">
                <q-btn
                  flat
                  round
                  color="positive"
                  icon="check"
                  class="q-mr-sm"
                  @click="handleRequest(request.id, 'approve')"
                />
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="close"
                  @click="handleRequest(request.id, 'decline')"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useCompetitionsStore } from 'src/stores/competition';

const $q = useQuasar();
const emit = defineEmits(['update:modelValue']);
const modelValue = ref(false);
const requests = ref([]);
const loading = ref(false);
const competitionsStore = useCompetitionsStore();
const innerModalVisibility = ref(false);

watch(modelValue, (newValue) => {
  innerModalVisibility.value = newValue;
});

const closeModal = () => {
  innerModalVisibility.value = false;
  emit('update:modelValue', false);
};

const fetchRequests = async () => {
  loading.value = true;
  try {
    const response = await api.get('league/requests');
    requests.value = response.data.requests.map(req => ({
      ...req,
      type: req.type === 'League' ? 'League' : 'Tournament',
    }));
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error loading requests',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 3000
    });
  } finally {
    loading.value = false;
  }
};

const handleRequest = async (requestId, action) => {
  try {
    const response = await api.post(`league/respond/${requestId}/${action}`);
    if (response.status === 200) {
      requests.value = requests.value.filter(req => req.id !== requestId);
      await competitionsStore.fetchCompetitions('league');
      await competitionsStore.fetchCompetitions('tournament');

      $q.notify({
        type: 'positive',
        message: `Request ${action}ed successfully`,
        position: 'top',
        timeout: 2000
      });

      closeModal();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Error ${action}ing request`,
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 3000
    });
  }
};

onMounted(() => {
  fetchRequests();
});

watch(innerModalVisibility, (newValue) => {
  if (newValue) fetchRequests();
});
</script>

<style scoped>
.requests-modal {
  width: 400px;
  max-width: 90vw;
}
</style>
