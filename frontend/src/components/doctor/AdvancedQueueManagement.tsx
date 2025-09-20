import React, { useState, useEffect } from 'react';
import { 
  getDoctorQueue, 
  reorderQueue, 
  applyQueueRules, 
  addWalkInPatient, 
  skipPatient,
  getQueueAnalytics,
  type AppointmentData 
} from '../../services/appointment.api';

interface AdvancedQueueManagementProps {
  doctorId: string;
  date: string;
}

interface QueueAnalytics {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  walkIns: number;
  skipped: number;
  urgent: number;
  vip: number;
}

const AdvancedQueueManagement: React.FC<AdvancedQueueManagementProps> = ({ doctorId, date }) => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueData, analyticsData] = await Promise.all([
        getDoctorQueue(doctorId, date),
        getQueueAnalytics(doctorId, date)
      ]);
      setAppointments(queueData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [doctorId, date]);

  const handleReorderQueue = async (reorderRequests: any[]) => {
    try {
      setLoading(true);
      await reorderQueue(doctorId, date, reorderRequests);
      await fetchData();
      setShowReorderModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRules = async () => {
    try {
      setLoading(true);
      await applyQueueRules(doctorId, date);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to apply queue rules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWalkIn = async (patientData: any) => {
    try {
      setLoading(true);
      await addWalkInPatient(doctorId, date, patientData);
      await fetchData();
      setShowWalkInForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add walk-in patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPatient = async (appointmentId: string, reason: string) => {
    try {
      setLoading(true);
      await skipPatient(appointmentId, reason);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to skip patient');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'in_session': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUrgent = (appointment: AppointmentData) => {
    return appointment.notes?.toLowerCase().includes('urgent') || false;
  };

  const isVip = (appointment: AppointmentData) => {
    return appointment.notes?.toLowerCase().includes('vip') || false;
  };

  const isWalkIn = (appointment: AppointmentData) => {
    return appointment.notes?.includes('[WALK-IN]') || false;
  };

  if (loading && !appointments.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalAppointments}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.walkIns}</div>
              <div className="text-sm text-gray-500">Walk-ins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.urgent}</div>
              <div className="text-sm text-gray-500">Urgent</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Management Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Management</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleApplyRules}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Apply Priority Rules
          </button>
          <button
            onClick={() => setShowWalkInForm(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add Walk-in
          </button>
          <button
            onClick={() => setShowReorderModal(true)}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Reorder Queue
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Queue</h3>
        <div className="space-y-3">
          {appointments.map((appointment, index) => (
            <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {appointment.patientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{appointment.patientName}</div>
                  <div className="text-sm text-gray-500">
                    Queue #{appointment.queueNumber} • {appointment.time}
                  </div>
                  <div className="flex space-x-2 mt-1">
                    {isUrgent(appointment) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        URGENT
                      </span>
                    )}
                    {isVip(appointment) && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        VIP
                      </span>
                    )}
                    {isWalkIn(appointment) && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        WALK-IN
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
                {appointment.status === 'waiting' && (
                  <button
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      const reason = prompt('Reason for skipping:');
                      if (reason) {
                        handleSkipPatient(appointment._id, reason);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Walk-in Form Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Walk-in Patient</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const patientData = {
                patientName: formData.get('patientName'),
                patientAddress: formData.get('patientAddress'),
                patientContact: formData.get('patientContact'),
                time: new Date().toTimeString().slice(0, 5),
                notes: formData.get('notes')
              };
              handleAddWalkIn(patientData);
            }}>
              <div className="space-y-4">
                <input
                  name="patientName"
                  type="text"
                  placeholder="Patient Name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  name="patientAddress"
                  type="text"
                  placeholder="Address"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  name="patientContact"
                  type="text"
                  placeholder="Contact Number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  name="notes"
                  placeholder="Notes (e.g., urgent, vip)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  Add Patient
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkInForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedQueueManagement;
