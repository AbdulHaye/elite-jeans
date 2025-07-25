import api from "./api";


export const getAllTechPacks = async () => {
  try {
    const response = await api.get('/api/techPack');
    return response.data; // Return the data for further use
  } catch (error) {
    console.error('Error fetching tech packs:', error);
    throw error;
  }
};

export const deleteTechPack = async (techPackId) => {
  try {
    await api.delete(`/api/techPack/${techPackId}`);
    return techPackId;
  } catch (error) {
    console.error('Error deleting tech pack:', error);
    throw error;
  }
};
