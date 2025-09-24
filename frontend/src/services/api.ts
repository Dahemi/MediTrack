import axios, { type AxiosInstance } from "axios";
import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("meditrack_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("meditrack_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API Types
export interface FirebaseLoginData {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  idToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  userType: "patient" | "doctor" | "admin";
  photoURL?: string;
  firebaseUid?: string;
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

export interface DoctorAvailability {
  day: string;
  date: string;
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

export interface DoctorRegisterData {
  name: string;
  email: string;
  password: string;
  userType: "doctor";
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  contactDetails: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability?: DoctorAvailability[];
}

export interface DoctorLoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Firebase Google Authentication for Patients
export const loginPatientWithGoogle = async (): Promise<
  ApiResponse<{ user: UserData }>
> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const idToken = await user.getIdToken();

    const firebaseData: FirebaseLoginData = {
      uid: user.uid,
      email: user.email!,
      name: user.displayName || user.email!.split("@")[0],
      photoURL: user.photoURL || undefined,
      idToken,
    };

    const response = await api.post("/patient/firebase-login", firebaseData);
    return response.data;
  } catch (error: any) {
    throw {
      success: false,
      message: error.message || "Google authentication failed",
    };
  }
};

// Traditional Patient Authentication
export const registerPatient = async (
  data: RegisterData
): Promise<ApiResponse<{ patient: UserData }>> => {
  try {
    const response = await api.post("/auth/signup", data);
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
): Promise<ApiResponse<{ patient: UserData }>> => {
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

export const verifyPatient = async (
  token: string
): Promise<ApiResponse<{ patient: UserData }>> => {
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

// Doctor Authentication (Traditional)
export const registerDoctor = async (
  data: DoctorRegisterData
): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.post("/patient/doctor-signup", data);
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

export const loginDoctor = async (
  data: DoctorLoginData
): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const response = await api.post("/patient/doctor-login", data);
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

// Doctor Management Functions
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
