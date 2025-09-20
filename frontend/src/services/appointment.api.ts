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
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
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
    const response = await api.put(`/appointment/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Network error occurred' };
  }
};

// Queue Management API
export interface QueueSession {
  doctorId: string;
  date: string;
  status: 'active' | 'paused' | 'stopped';
  currentQueueNumber?: number;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  stoppedAt?: string;
}

export interface QueueStats {
  total: number;
  waiting: number;
  called: number;
  inSession: number;
  completed: number;
  currentQueueNumber: number | null;
  nextQueueNumber: number | null;
}

export interface QueueStatus {
  session: QueueSession | null;
  stats: QueueStats;
  currentPatient: AppointmentData | null;
  nextPatients: AppointmentData[];
}

export interface PatientQueueInfo {
  appointment: AppointmentData;
  queueSession: QueueSession | null;
  estimatedWaitTime: number;
  position: number;
}

// Get doctor's queue
export const getDoctorQueue = async (doctorId: string, date: string): Promise<AppointmentData[]> => {
  try {
    const response = await api.get(`/appointment/queue/${doctorId}/${date}`);
    return response.data.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch doctor queue' };
  }
};

// Get queue status
export const getQueueStatus = async (doctorId: string, date: string): Promise<QueueStatus> => {
  try {
    const response = await api.get(`/appointment/queue/${doctorId}/${date}/status`);
    return response.data.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch queue status' };
  }
};

// Queue control functions
export const startQueue = async (doctorId: string, date: string): Promise<ApiResponse<QueueSession>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/start`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to start queue' };
  }
};

export const pauseQueue = async (doctorId: string, date: string): Promise<ApiResponse<QueueSession>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/pause`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to pause queue' };
  }
};

export const resumeQueue = async (doctorId: string, date: string): Promise<ApiResponse<QueueSession>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/resume`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to resume queue' };
  }
};

export const stopQueue = async (doctorId: string, date: string): Promise<ApiResponse<QueueSession>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/stop`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to stop queue' };
  }
};

// Call next patient
export const callNextPatient = async (doctorId: string, date: string): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/call-next`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to call next patient' };
  }
};

// Start patient session
export const startPatientSession = async (appointmentId: string): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.post(`/appointment/${appointmentId}/start-session`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to start patient session' };
  }
};

// Complete patient session
export const completePatientSession = async (appointmentId: string): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.post(`/appointment/${appointmentId}/complete-session`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to complete patient session' };
  }
};

// Get patient queue info
export const getPatientQueueInfo = async (appointmentId: string): Promise<PatientQueueInfo> => {
  try {
    const response = await api.get(`/appointment/patient/${appointmentId}/queue-info`);
    return response.data.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch patient queue info' };
  }
};

// Advanced Queue Management API

export interface QueueReorderRequest {
  appointmentId: string;
  newPosition: number;
  reason?: string;
}

export interface QueueRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    patientAge?: { min?: number; max?: number };
    appointmentType?: string[];
    isUrgent?: boolean;
    isVip?: boolean;
  };
  action: 'move_to_front' | 'move_to_back' | 'skip' | 'priority_boost';
}

export interface QueueAnalytics {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  walkIns: number;
  skipped: number;
  urgent: number;
  vip: number;
}

// Reorder queue
export const reorderQueue = async (doctorId: string, date: string, reorderRequests: QueueReorderRequest[]): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/reorder`, { reorderRequests });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to reorder queue' };
  }
};

// Apply queue rules
export const applyQueueRules = async (doctorId: string, date: string, rules?: QueueRule[]): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/apply-rules`, { rules });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to apply queue rules' };
  }
};

// Add walk-in patient
export const addWalkInPatient = async (doctorId: string, date: string, patientData: any): Promise<ApiResponse<AppointmentData>> => {
  try {
    const response = await api.post(`/appointment/queue/${doctorId}/${date}/walk-in`, patientData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to add walk-in patient' };
  }
};

// Skip patient
export const skipPatient = async (appointmentId: string, reason: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`/appointment/${appointmentId}/skip`, { reason });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to skip patient' };
  }
};

// Get queue analytics
export const getQueueAnalytics = async (doctorId: string, date: string): Promise<QueueAnalytics> => {
  try {
    const response = await api.get(`/appointment/queue/${doctorId}/${date}/analytics`);
    return response.data.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch queue analytics' };
  }
};
