<template>
  <div class="tournament-groups-container">
    <template v-for="(groupTable, groupName) in groupedLeagueTables" :key="groupName">
      <q-card class="league-table-card rounded-borders q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Group {{ groupName }}</div>
          <q-table
            v-model:loading="loading"
            :rows="groupTable"
            :columns="columns"
            row-key="_id"
            flat
            :pagination="{ rowsPerPage: 0 }"
            class="custom-table"
          >
            <template v-slot:loading>
              <q-inner-loading showing>
                <q-spinner-dots size="50px" color="primary" />
              </q-inner-loading>
            </template>
            <template v-slot:body-cell-goalStats="props">
              <q-td :props="props">
                {{ props.row.goalsFor }}-{{ props.row.goalsAgainst }}
              </q-td>
            </template>
            <template v-slot:body-cell-position="props">
              <q-td :props="props">
                <q-chip
                  dense
                  :color="getPositionColor(props.rowIndex + 1)"
                  text-color="white"
                  class="position-chip"
                >
                  {{ props.rowIndex + 1 }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'

const props = defineProps({
  competitionId: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
})

const columns = [
  {
    name: 'position',
    label: '#',
    field: 'position',
    align: 'center',
    sortable: false
  },
  {
    name: 'team',
    label: 'Team',
    field: row => row.user.username,
    align: 'left',
    sortable: true
  },
  {
    name: 'played',
    label: 'Pl',
    field: 'played',
    align: 'center',
    sortable: true
  },
  {
    name: 'won',
    label: 'W',
    field: 'won',
    align: 'center',
    sortable: true
  },
  {
    name: 'drawn',
    label: 'D',
    field: 'drawn',
    align: 'center',
    sortable: true
  },
  {
    name: 'lost',
    label: 'L',
    field: 'lost',
    align: 'center',
    sortable: true
  },
  {
    name: 'goalStats',
    label: '+/-',
    field: 'goalStats',
    align: 'center',
    sortable: false
  },
  {
    name: 'goalDifference',
    label: 'GD',
    field: 'goalDifference',
    align: 'center',
    sortable: true
  },
  {
    name: 'points',
    label: 'Pts',
    field: 'points',
    align: 'center',
    sortable: true
  }
]

const leagueTable = ref([])
const loading = ref(true)

const groupedLeagueTables = computed(() => {
  return leagueTable.value.reduce((groups, team) => {
    const group = team.group
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(team)

    // Sort each group by points and goal difference
    groups[group].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points
      }
      return b.goalDifference - a.goalDifference
    })

    return groups
  }, {})
})

const getPositionColor = (position) => {
  if (position === 1) return 'positive'
  if (position === 2) return 'secondary'
  if (position === 3) return 'accent'
  return 'grey-7'
}

async function fetchTournamentTable() {
  try {
    const response = await api.get(`/tournament/${props.competitionId}/table`)
    leagueTable.value = response.data
  } catch (error) {
    console.error('Error fetching league table:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTournamentTable();
});
</script>

<style lang="scss" scoped>
.tournament-groups-container {
  max-width: 1200px;
  margin: 0 auto;
}

.league-table-card {
  border-radius: 16px;

  :deep(.q-table) {
    border-radius: 16px;
  }
}

.position-chip {
  min-width: 24px;
  justify-content: center;
}

:deep(.q-table) {
  border: none;

  th, td {
    border: none !important;
  }

  thead tr {
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  tbody tr {
    border: none;
  }

  th {
    font-weight: bold;
  }

  tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
}
</style>
