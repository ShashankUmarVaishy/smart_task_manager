// src/utils/api.js — Axios Instance
// =============================================
// Creates a pre-configured axios instance so we
// don't repeat the base URL in every component.
// Base URL is read from VITE_API_BASE_URL in .env

import axios from 'axios';
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
