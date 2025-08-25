import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PatientData {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

// API Functions
export const registerPatient = async (data: RegisterData): Promise<ApiResponse<{ patient: PatientData }>> => {
  try {
    const response = await api.post('/auth/signup', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const verifyPatient = async (token: string): Promise<ApiResponse<{ patient: PatientData }>> => {
  try {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const loginPatient = async (data: LoginData): Promise<ApiResponse<{ patient: PatientData }>> => {
  try {
    const response = await api.post('/auth/login', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const resendVerification = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export default api;