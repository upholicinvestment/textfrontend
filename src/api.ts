import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.upholictech.com/api', // Your backend URL
  withCredentials: true
});

export default api;
