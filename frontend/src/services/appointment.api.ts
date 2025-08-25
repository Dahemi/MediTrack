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
  };
  date: string;
  time: string;
  status: 'booked' | 'in_session' | 'completed' | 'cancelled';
  queueNumber: number;
  notes?: string;
}


export const getAppointments = async (): Promise<AppointmentData[]> => {
  try {
    const response = await api.get('/appointment');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
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
