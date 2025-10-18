import axios from "axios";

const API_URL = "http://localhost:5000/api/diagnosis";

// Helper function to get the authentication token
const getAuthToken = (): string => {
  return localStorage.getItem("meditrack_doctor_token") || 
         localStorage.getItem("meditrack_admin_token") || 
         localStorage.getItem("token") || 
         "";
};

export interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  price: number;
}

export interface Diagnosis {
  _id: string;
  appointmentId: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
  diagnosis: string;
  symptoms: string;
  notes?: string;
  drugs: Drug[];
  registrationFee: number;
  doctorFee: number;
  drugsCost: number;
  totalAmount: number;
  prescribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiagnosisData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms: string;
  notes?: string;
  drugs: Drug[];
  doctorFee: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalRegistrationFees: number;
  totalDoctorFees: number;
  totalDrugsCost: number;
  diagnosisCount: number;
  averagePerDiagnosis: number;
}

// Create a new diagnosis
export const createDiagnosis = async (data: CreateDiagnosisData): Promise<Diagnosis> => {
  try {
    const token = getAuthToken();
    console.log('Creating diagnosis with token:', token ? 'Token found' : 'No token');
    const response = await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnosis;
  } catch (error: any) {
    console.error('Diagnosis API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create diagnosis");
  }
};

// Get diagnosis by appointment ID
export const getDiagnosisByAppointment = async (appointmentId: string): Promise<Diagnosis | null> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/appointment/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnosis;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(error.response?.data?.message || "Failed to fetch diagnosis");
  }
};

// Get all diagnoses by doctor ID
export const getDiagnosesByDoctor = async (doctorId: string): Promise<Diagnosis[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/doctor/${doctorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnoses;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch diagnoses");
  }
};

// Get all diagnoses by patient ID
export const getDiagnosesByPatient = async (patientId: string): Promise<Diagnosis[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnoses;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch diagnoses");
  }
};

// Get all diagnoses (admin only)
export const getAllDiagnoses = async (): Promise<Diagnosis[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnoses;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch diagnoses");
  }
};

// Update diagnosis
export const updateDiagnosis = async (
  diagnosisId: string,
  data: Partial<CreateDiagnosisData>
): Promise<Diagnosis> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/${diagnosisId}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.diagnosis;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update diagnosis");
  }
};

// Get revenue statistics
export const getRevenueStats = async (params?: {
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<RevenueStats> => {
  try {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    if (params?.doctorId) queryParams.append("doctorId", params.doctorId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const response = await axios.get(`${API_URL}/stats/revenue?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.stats;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch revenue stats");
  }
};
