import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('memora_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const googleLogin = (idToken) => api.post('/auth/google', { idToken });
export const getMe = () => api.get('/auth/me');
export const updateProfile = (formData) =>
    api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

// Memories
export const createMemory = (formData) =>
    api.post('/memories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const getMyMemories = (params) => api.get('/memories/my', { params });
export const getMemory = (id) => api.get(`/memories/${id}`);
export const updateMemory = (id, formData) =>
    api.put(`/memories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const deleteMemory = (id) => api.delete(`/memories/${id}`);
export const getTimelineGrouped = () => api.get('/memories/timeline/grouped');

// Users
export const getUserProfile = (username) => api.get(`/users/${username}`);

export default api;
