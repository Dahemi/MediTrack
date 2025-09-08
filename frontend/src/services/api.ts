import axios, { type AxiosInstance } from "axios";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// API Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType?: "patient" | "doctor" | "admin";
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
  userType: "patient" | "doctor" | "admin";
  isVerified: boolean;
  // Doctor-specific fields
  fullName?: string;
  specialization?: string;
  yearsOfExperience?: number;
  contactDetails?: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability?: DoctorAvailability[];
}

// Keep PatientData for backward compatibility
export interface PatientData {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

// Doctor Types
export interface DoctorAvailability {
  day: string;
  date: string; // ISO string
  startTime: string;
  endTime: string;
  slots: number;
}

export interface DoctorData {
  _id?: string;
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  contactDetails: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability: DoctorAvailability[];
}

// API Functions
export const registerPatient = async (
  data: RegisterData
): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.post("/auth/signup", {
      ...data,
      userType: "patient",
    });
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const verifyPatient = async (
  token: string
): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const loginPatient = async (
  data: LoginData
): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.post("/auth/login", data);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const resendVerification = async (
  email: string
): Promise<ApiResponse> => {
  try {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

// Doctor API
export const createDoctor = async (
  data: DoctorData
): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.post("/doctors", data);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const getDoctors = async (): Promise<
  ApiResponse<{ doctors: DoctorData[] }>
> => {
  try {
    const response = await api.get("/doctors");
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const updateDoctor = async (
  id: string,
  data: DoctorData
): Promise<ApiResponse<{ doctor: DoctorData }>> => {
  try {
    const response = await api.put(`/doctors/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export const deleteDoctor = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || {
        success: false,
        message: "Network error occurred",
      }
    );
  }
};

export default api;
