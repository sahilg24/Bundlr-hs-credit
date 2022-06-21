import axios from 'axios';

const API = axios.create({baseURL: 'http://localhost:5000'})

export const upload = (file) => API.post('/', file);

export const hasFunds = (size) => API.post(`/funds/${size}`);

