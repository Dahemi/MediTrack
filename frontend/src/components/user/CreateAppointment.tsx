import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext'; // Add this import

interface AppointmentFormData {
  patientId: string; // Add patientId field
  patientName: string;
  patientAddress: string;
  patientContact: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  notes: string;
}

const CreateAppointment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get logged in user from context
  
  // Get doctor and slot info from navigation state
  const doctor = location.state?.doctor;
  const date = location.state?.date || format(new Date(), 'yyyy-MM-dd');
  const time = location.state?.time || '';

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: user?.id || '', // Add user ID
    patientName: user?.name || '', // Pre-fill name if available
    patientAddress: '',
    patientContact: '',
    doctorId: doctor?._id || '',
    doctorName: doctor?.fullName || '',
    date,
    time,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user?.id) {
      setError('You must be logged in to create an appointment');
      setLoading(false);
      return;
    }

    try {
      console.log('Creating appointment with data:', { ...formData, patientId: user.id }); // Debug log
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          patientId: user.id
        })
      });

      const data = await response.json();
      console.log('Appointment creation response:', data); // Debug log

      if (response.ok) {
        navigate('/appointment/confirmation', {
          state: { appointment: data.data }
        });
      } else {
        setError(data.message || 'Failed to create appointment');
      }
    } catch (error) {
      setError('Error creating appointment. Please try again.');
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Book Appointment</h2>
          <p className="mt-2 text-sm text-gray-600">Schedule your visit with our healthcare professionals</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-md">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient Name</label>
              <input
                name="patientName"
                type="text"
                required
                value={formData.patientName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                name="patientAddress"
                type="text"
                required
                value={formData.patientAddress}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                name="patientContact"
                type="text"
                required
                value={formData.patientContact}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Doctor</label>
              <input
                name="doctorName"
                type="text"
                value={formData.doctorName}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  name="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  name="time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointment;