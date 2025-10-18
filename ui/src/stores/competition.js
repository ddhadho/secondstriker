import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';

export const useCompetitionsStore = defineStore('competitions', () => {
  const competitions = ref({
    leagues: [],
    tournaments: [],
  });

  const specificCompetition = ref(null); // Store for a single competition

  // Generic fetch function for all leagues or tournaments
  const fetchCompetitions = async (type) => {
    try {
      if (!['league', 'tournament'].includes(type)) {
        throw new Error('Invalid competition type');
      }

      const endpoint = type === 'league' ? '/league/get' : '/tournament/get';
      const response = await api.get(endpoint);

      // Filter competitions with status 'draft' or 'ongoing'
      competitions.value[type + 's'] = response.data.filter((item) =>
        ['draft', 'ongoing'].includes(item.status)
      );
    } catch (error) {
      console.error(`Error loading ${type}s:`, error);
    }
  };

  // Fetch a specific competition by its ID
  const fetchCompetitionById = async (competitionId, competitionType) => {
    try {
      // Validate competitionType
      if (!['league', 'tournament'].includes(competitionType)) {
        throw new Error('Invalid competition type');
      }

      // Construct the endpoint based on the type
      const endpoint =
        competitionType === 'league'
          ? `/league/get/${competitionId}`
          : `/tournament/get/${competitionId}`

      // Perform the API call
      const response = await api.get(endpoint);

      // Check if the response contains data
      if (!response.data) {
        throw new Error('No data returned from API');
      }

      // Assign the data to specificCompetition
      specificCompetition.value = response.data;
    } catch (error) {
      console.error(
        `Error loading competition with ID ${competitionId} of type ${competitionType}:`,
        error
      );
    }
  };

  return {
    competitions,
    specificCompetition,
    fetchCompetitions,
    fetchCompetitionById,
  };
});
