import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/Footer';

// Add modal state and selected appointment
interface ModalState {
  isOpen: boolean;
  type: 'reschedule' | 'cancel' | null;
  appointmentId: string | null;
}

interface Appointment {
  _id: string;
  queueNumber: number;
  doctorName: string;
  date: string;
  time: string;
  status: 'booked' | 'in_session' | 'completed' | 'cancelled';
  notes?: string;
}

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    appointmentId: null
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching appointments with user ID:', user.id); // Debug log
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/appointment/patient/${user.id}`);
        const data = await response.json();
        
        console.log('API Response:', data); // Debug log

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch appointments');
        }

        if (!data.success) {
          setError(data.message || 'Failed to fetch appointments');
          setAppointments([]);
        } else {
          setAppointments(data.data || []);
        }
      } catch (error: any) {
        console.error('Error details:', error);
        setError(error.message || 'Failed to fetch appointments. Please try again later.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  const getStatusBadgeColor = (status: Appointment['status']) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'in_session': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReschedule = async () => {
    if (!modal.appointmentId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/appointment/${modal.appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Rescheduling appointment',
          cancelledBy: 'patient'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      // Close modal and navigate to doctors directory
      setModal({ isOpen: false, type: null, appointmentId: null });
      navigate('/doctorsdir');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleCancel = async () => {
    if (!modal.appointmentId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/appointment/${modal.appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Cancelled by patient',
          cancelledBy: 'patient'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      // Close modal and refresh appointments
      setModal({ isOpen: false, type: null, appointmentId: null });
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  // Add this JSX for the modal
  const Modal = () => {
    if (!modal.isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white/90 backdrop-filter backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {modal.type === 'reschedule' 
              ? 'Reschedule Appointment'
              : 'Cancel Appointment'}
          </h3>
          <p className="text-gray-600 mb-6">
            {modal.type === 'reschedule'
              ? 'This appointment will be cancelled and you will be redirected to book a new appointment.'
              : 'Your appointment will be cancelled. This action cannot be undone.'}
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setModal({ isOpen: false, type: null, appointmentId: null })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              No, Keep it
            </button>
            <button
              onClick={modal.type === 'reschedule' ? handleReschedule : handleCancel}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                modal.type === 'reschedule' 
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Yes, {modal.type === 'reschedule' ? 'Reschedule' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Appointments</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No appointments found.</p>
            <button 
              onClick={() => window.location.href = '/doctorsdir'}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">#{appointment.queueNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{appointment.doctorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(appointment.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{appointment.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {appointment.status === 'booked' && (
                            <>
                              <button
                                onClick={() => setModal({ 
                                  isOpen: true, 
                                  type: 'reschedule', 
                                  appointmentId: appointment._id 
                                })}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setModal({ 
                                  isOpen: true, 
                                  type: 'cancel', 
                                  appointmentId: appointment._id 
                                })}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <Modal />
    </div>
  );
};

export default MyAppointments;