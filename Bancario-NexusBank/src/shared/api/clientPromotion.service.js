import axios from 'axios';

const promotionsBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api/v1';

const axiosPromotions = axios.create({
  baseURL: promotionsBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getClientPromotions = async (search = '') => {
  try {
    const response = await axiosPromotions.get('/catalog', {
      params: { search }
    });
    return response.data;
  } catch (error) {
    console.error('Error in getClientPromotions:', error);
    throw error;
  }
};
