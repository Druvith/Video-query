import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

export const getProjects = async () => {
  const response = await axios.get(`${API_BASE_URL}/projects`);
  return response.data;
};

export const getProject = async (projectId) => {
  const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
  return response.data;
};

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

export const queryVideo = async (projectId, query) => {
  const response = await axios.post(`${API_BASE_URL}/query`, { project_id: projectId, query });
  return response.data;
};

export const createClip = async (projectId, startTime, endTime) => {
  const response = await axios.post(`${API_BASE_URL}/clip`, { project_id: projectId, start_time: startTime, end_time: endTime });
  return response.data;
};
