import axios from 'axios';
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('API URL:', import.meta.env.VITE_API_URL);
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Response error:', error.response?.data || error.message);
    }
    
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "patient" | "doctor" | "admin";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  doctors: never[];
  success: boolean;
  message: string;
  data?: T;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  isVerified: boolean;
}

export interface AuthResponse {
  user: UserData;
  token: string;
}

// Doctor Types
export interface DoctorAvailability {
  date: string; // ISO string
  startTime: string;
  endTime: string;
}

export interface DoctorData {
  _id?: string;
  userId?: string; // Reference to User model
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  contactDetails: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability: DoctorAvailability[];
  isVerifiedDoctor?: boolean; // Admin verification status
  user?: UserData; // Populated user data
}

// User Management Types
export interface UserManagementData {
  _id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Functions
export const registerUser = async (data: RegisterData): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.post('/auth/signup', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const verifyUser = async (token: string): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const loginUser = async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.post('/auth/login', data);
    
    // Store token and user data in localStorage
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const getProfile = async (): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.get('/auth/profile');
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

// User Management API (Admin only)
export const getAllUsers = async (): Promise<ApiResponse<{ users: UserManagementData[]; total: number }>> => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const getUsersByRole = async (role: string): Promise<ApiResponse<{ users: UserManagementData[]; total: number; role: string }>> => {
  try {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const updateUserRole = async (userId: string, role: string): Promise<ApiResponse<{ user: UserManagementData }>> => {
  try {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const deleteUser = async (userId: string): Promise<ApiResponse> => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Doctor API (Admin functions)
export const createDoctor = async (data: DoctorData): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.post('/doctor', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const getDoctors = async (): Promise<ApiResponse<{ doctors: DoctorData[] }>> => {
  try {
    const response = await api.get('/doctor');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const updateDoctor = async (id: string, data: DoctorData): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.put(`/doctor/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const deleteDoctor = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await api.delete(`/doctor/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Doctor Profile API (for logged-in doctors)
export const getMyDoctorProfile = async (): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.get('/doctor/profile/me');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const updateMyDoctorProfile = async (data: Partial<DoctorData>): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.put('/doctor/profile/me', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const getDoctorByUserId = async (userId: string): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.get(`/doctor/user/${userId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const updateDoctorByUserId = async (userId: string, data: Partial<DoctorData>): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.put(`/doctor/user/${userId}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Debug functions (temporary)
export const debugGetAllDoctors = async (): Promise<ApiResponse<{ count: number, doctors: DoctorData[] }>> => {
  try {
    const response = await api.get('/doctor/debug/all');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const debugGetCurrentUser = async (): Promise<ApiResponse<{ user: any, userId: string, role: string }>> => {
  try {
    const response = await api.get('/doctor/debug/user');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Get all doctors with availability
export const getDoctorsWithAvailability = async (): Promise<ApiResponse<{ doctors: DoctorData[] }>> => {
  try {
    const response = await api.get('/doctor/availability');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Get available time slots for a doctor on a specific date
export const getDoctorAvailableSlots = async (doctorId: string, date: string): Promise<ApiResponse<{ slots: string[] }>> => {
  try {
    const response = await api.get(`/doctor/${doctorId}/slots?date=${date}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Auth utilities
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = (): UserData | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export default api;