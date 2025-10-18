<template>
  <q-card class="competition-card q-pa-md" flat bordered>
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="text-h6">Competition Info</div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Admin & Financial Details -->
        <div class="col-12 col-md-6">
          <q-list bordered separator>
            <q-item v-if="competitionDetails.creator">
              <q-item-section>
                <q-item-label caption>Admin</q-item-label>
                <q-item-label>{{ competitionDetails.creator.username || 'Unknown Admin' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Entry Fee</q-item-label>
                <q-item-label>{{ formatPrize(competitionDetails.fee) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Total Pool</q-item-label>
                <q-item-label class="text-weight-bold">
                  {{ formatPrize(competitionDetails.prizePool) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <!-- Prize Distribution -->
      <div class="q-mt-md" v-if="competitionDetails.awardsDistribution">
        <div class="text-subtitle1 q-mb-sm">Prize Distribution</div>
        <q-list bordered separator>
          <q-item v-if="competitionDetails.awardsDistribution.firstPlace > 0">
            <q-item-section avatar>
              <q-icon name="emoji_events" color="amber" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Winner</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold">
                {{ formatPrize(competitionDetails.awardsDistribution.firstPlace) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="competitionDetails.awardsDistribution.secondPlace > 0">
            <q-item-section avatar>
              <q-icon name="emoji_events" color="grey-6" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Runner-up</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold">
                {{ formatPrize(competitionDetails.awardsDistribution.secondPlace) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="competitionDetails.awardsDistribution.thirdPlace > 0">
            <q-item-section avatar>
              <q-icon name="emoji_events" color="brown-5" size="sm" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Third Place</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold">
                {{ formatPrize(competitionDetails.awardsDistribution.thirdPlace) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Team Information -->
      <div class="col-12 col-md-6">
        <q-list bordered separator>
          <q-item>
            <q-item-section>
              <q-item-label caption>Total Members</q-item-label>
              <q-item-label>{{ competitionDetails.members?.length || 0 }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Rules -->
      <div class="q-mt-md" v-if="competitionDetails.rules && competitionDetails.rules.length > 0">
        <div class="text-subtitle1 q-mb-sm">Competition Rules</div>
        <q-card-section class="q-pa-sm bg-grey-2" >
          <ul>
            <li v-for="rule in competitionDetails.rules" :key="rule" class="rule-color">{{ rule }}</li>
          </ul>
        </q-card-section>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  competitionDetails: {
    type: Object,
    required: true,
    default: () => ({
      creator: { username: '' },
      fee: 0,
      prizePool: 0,
      awardsDistribution: {
        firstPlace: 0,
        secondPlace: 0,
        thirdPlace: 0,
      },
      members: [],
      rules: [],
    }),
  },
});

// Helper function to format the prize amount in currency format (KES)
function formatPrize(amount) {
  return amount
    ? new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
      }).format(amount)
    : 'N/A';
}
</script>

<style scoped>
.competition-card {
  max-width: 900px;
  margin: 0 auto;
}

.rule-color {
  color: rgb(15, 15, 19);
}
</style>
