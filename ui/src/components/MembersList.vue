<template>
  <q-card flat bordered class="competition-members-card">
    <q-card-section class="bg-primary text-white">
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-icon name="people" size="sm" class="q-mr-sm" />
        </div>
        <q-chip
          outline
          color="white"
          text-color="white"
          :label="`${members.length} ${members.length === 1 ? 'Member' : 'Members'}`"
        />
      </div>
    </q-card-section>

    <q-card-section class="q-pa-none">
      <q-list bordered separator>
        <q-item v-if="members.length === 0" class="text-center text-grey-6">
          <q-item-section class="text-center q-py-md">
            <q-icon name="groups" size="3em" color="grey-4" />
            <div class="q-mt-sm">No members yet.</div>
          </q-item-section>
        </q-item>

        <q-item
          v-for="(member, index) in members"
          :key="index"
          class="q-py-md"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-avatar
              color="secondary"
              text-color="white"
              :label="member.username.charAt(0).toUpperCase()"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{ member.username }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              round
              color="grey-7"
              icon="more_vert"
              size="sm"
            >
              <q-menu>
                <q-list style="min-width: 100px">
                  <q-item clickable v-close-popup>
                    <q-item-section>View Profile</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>Message</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  members: {
    type: Array,
    required: true,
    default: () => []
  },
});
</script>

<style lang="scss" scoped>
.competition-members-card {
  max-width: 600px;
  margin: 0 auto;

  .q-item {
    min-height: 72px;
  }
}
</style>
