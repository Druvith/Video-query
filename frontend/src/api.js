import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const processVideo = async (url) => {
  const response = await axios.post(`${API_BASE_URL}/process`, { url });
  return response.data;
};

export const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const queryVideo = async (query) => {
  const response = await axios.post(`${API_BASE_URL}/query`, { query });
  return response.data;
};

export const createClip = async (filename, startTime, endTime) => {
  const response = await axios.post(`${API_BASE_URL}/clip`, { filename, start_time: startTime, end_time: endTime });
  return response.data;
};

export const deleteIndex = async () => {
  const response = await axios.post(`${API_BASE_URL}/delete-index`);
  return response.data;
};