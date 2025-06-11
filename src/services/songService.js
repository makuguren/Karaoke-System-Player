import axios from 'axios';

// Use /api for both development and production
// Development: Vite proxy in vite.config.js
// Production: Vercel rewrites in vercel.json
const API_BASE_URL = '/api';

/**
 * Fetch song information by song number
 * @param {string} songNumber - The song number to fetch
 * @returns {Promise<Object>} - Song data object
 */
export const getSongByNumber = async (songNumber) => {
  try {
    console.log(`Fetching song data for number: ${songNumber}`);
    console.log(`Using API base URL: ${API_BASE_URL}`);
    
    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 10000);
    });
    
    // Create the API request promise
    const requestPromise = axios.get(`${API_BASE_URL}/song/${songNumber}`, {
      timeout: 10000, // Set axios timeout
    });
    
    // Race the request against the timeout
    const response = await Promise.race([requestPromise, timeoutPromise]);
    
    console.log(`Received song data:`, response.data);
    return response.data;
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Request timed out' || (error.code && error.code === 'ECONNABORTED')) {
      console.error('Connection timeout when fetching song data');
      throw new Error('Connection timeout. Please try again.');
    } else if (error.response) {
      // Server responded with an error status
      console.error(`Server error ${error.response.status}:`, error.response.data);
      if (error.response.status === 404) {
        throw new Error(`Song number ${songNumber} not found`);
      } else {
        throw new Error(`Server error (${error.response.status}). Please try again.`);
      }
    } else if (error.request) {
      // No response received from server
      console.error('No response received from server:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else went wrong
      console.error('Error fetching song:', error.message);
      throw error;
    }
  }
}; 