import api, { type ApiResponse } from './api';

export interface AppointmentData {
  _id: string;
  patientId: {
    name: string;
    email: string;
  };
  doctorId: {
    name: string;
    specialization: string;
    email?: string;
  };
  date: string;
  time: string;
  status: 'booked' | 'in_session' | 'completed' | 'cancelled';
  queueNumber: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}


export const getAppointments = async (): Promise<AppointmentData[]> => {
  try {
    const response = await api.get('/appointment');
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch appointments' 
    };
  }
};

export const updateAppointmentStatus = async (
  id: string, 
  status: AppointmentData['status']
): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.put(`/appointment/${id}`, { status });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

export const getDoctorAppointments = async (doctorId: string): Promise<AppointmentData[]> => {
  try {
    const response = await api.get(`/appointment/doctor/${doctorId}`);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch doctor appointments' 
    };
  }
};

export const getMyAppointments = async (): Promise<AppointmentData[]> => {
  try {
    const response = await api.get('/appointment/doctor/my');
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch my appointments' 
    };
  }
};

export const getMyPatientAppointments = async (): Promise<AppointmentData[]> => {
  try {
    const response = await api.get('/appointment/patient/my');
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch my patient appointments' 
    };
  }
};

export const createAppointment = async (appointmentData: {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  notes?: string;
  queueNumber: number;
}): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.post('/appointment', appointmentData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};
