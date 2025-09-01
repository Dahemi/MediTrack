import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getCurrentUser } from '../../services/api';
import { getDoctorsWithAvailability, getDoctorAvailableSlots } from '../../services/api';
import { createAppointment } from '../../services/appointment.api';
import type { DoctorData, UserData } from '../../services/api';
import PatientSidebar from './PatientSidebar';
import PatientHeader from './PatientHeader';

interface AppointmentFormData {
  doctorId: string;
  date: string;
  time: string;
  notes: string;
}

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: ''
  });
  
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      fetchAvailableSlots(formData.doctorId, formData.date);
    } else {
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.date]);

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors with availability...');
      const response = await getDoctorsWithAvailability();
      console.log('Doctors response:', response);
      setDoctors(response.data?.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors');
    }
  };

  const fetchAvailableSlots = async (doctorId: string, date: string) => {
    try {
      setLoadingSlots(true);
      console.log('=== FETCHING AVAILABLE SLOTS ===');
      console.log('Doctor ID:', doctorId);
      console.log('Date:', date);
      console.log('Date type:', typeof date);
      
      // First, let's debug all doctors
      try {
        const allDoctorsResponse = await fetch(`http://localhost:5000/api/doctor/debug/all`);
        const allDoctorsData = await allDoctorsResponse.json();
        console.log('=== ALL DOCTORS DEBUG DATA ===');
        console.log('All doctors response:', allDoctorsData);
        console.log('Doctors count:', allDoctorsData.data?.count);
        console.log('Doctors list:', allDoctorsData.data?.doctors);
      } catch (allDoctorsError) {
        console.error('All doctors debug request failed:', allDoctorsError);
      }
      
      // Then debug the specific doctor
      try {
        const debugResponse = await fetch(`http://localhost:5000/api/doctor/debug/${doctorId}`);
        const debugData = await debugResponse.json();
        console.log('=== SPECIFIC DOCTOR DEBUG DATA ===');
        console.log('Debug response:', debugData);
        console.log('Doctor availability:', debugData.data?.availability);
        console.log('Availability length:', debugData.data?.availabilityLength);
        console.log('Has availability:', debugData.data?.hasAvailability);
        console.log('Is array:', debugData.data?.isArray);
      } catch (debugError) {
        console.error('Specific doctor debug request failed:', debugError);
      }
      
      const response = await getDoctorAvailableSlots(doctorId, date);
      console.log('Available slots response:', response);
      console.log('Response data:', response.data);
      console.log('Slots array:', response.data?.slots);
      
      const slots = response.data?.slots || [];
      console.log('Setting available slots to:', slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      console.error('Error details:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset time when doctor or date changes
    if (name === 'doctorId' || name === 'date') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        time: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Please log in to book an appointment');
      setLoading(false);
      return;
    }

    try {
      // Find the selected doctor to get their userId
      const selectedDoctor = doctors.find(d => d._id === formData.doctorId);
      if (!selectedDoctor) {
        setError('Doctor not found');
        setLoading(false);
        return;
      }

      console.log('=== SELECTED DOCTOR ===');
      console.log('Selected doctor:', selectedDoctor);
      console.log('Doctor _id:', selectedDoctor._id);
      console.log('Doctor userId:', selectedDoctor.userId);

      const appointmentData = {
        patientId: user.id,
        doctorId: selectedDoctor.userId, // Use the doctor's userId, not the doctor document ID
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        queueNumber: Math.floor(Math.random() * 100) + 1 // Temporary queue number generation
      };

      console.log('=== CREATING APPOINTMENT ===');
      console.log('Appointment data being sent:', appointmentData);
      console.log('Current user:', user);

      const response = await createAppointment(appointmentData);
      
      console.log('=== APPOINTMENT CREATION RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      
      if (response.success) {
        console.log('=== NAVIGATING TO CONFIRMATION ===');
        console.log('Navigation state:', { appointment: response.data });
        navigate('/appointment/confirmation', { 
          state: { appointment: response.data } 
        });
      } else {
        console.log('=== APPOINTMENT CREATION FAILED ===');
        console.log('Error message:', response.message);
        setError(response.message || 'Failed to create appointment');
      }
    } catch (error: any) {
      console.log('=== APPOINTMENT CREATION ERROR ===');
      console.log('Error object:', error);
      console.log('Error message:', error.message);
      setError(error.message || 'Error creating appointment. Please try again.');
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => d._id === formData.doctorId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="flex h-screen">
        <PatientSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PatientHeader user={user || undefined} />
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Header */}
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                            <p className="text-gray-600">Schedule your visit with our healthcare professionals</p>
                          </div>
                        </div>
                      </div>

                                    {/* Main Form */}
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doctor Selection */}
                    <div className="lg:col-span-2">
                      <label htmlFor="doctorId" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        Select Doctor
                      </label>
                      <select
                        id="doctorId"
                        name="doctorId"
                        required
                        value={formData.doctorId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="">Choose a doctor...</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.fullName} - {doctor.specialization}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Doctor Info */}
                    {selectedDoctor && (
                      <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-blue-900">Dr. {selectedDoctor.fullName}</h3>
                            <p className="text-blue-700 font-medium">{selectedDoctor.specialization}</p>
                            <p className="text-blue-600 text-sm mt-1">{selectedDoctor.yearsOfExperience} years of experience</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Date Selection */}
                    <div>
                      <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Select Date
                      </label>
                      <div className="relative">
                        <input
                          id="date"
                          name="date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={handleChange}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                          onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                            e.target.showPicker?.();
                          }}
                        />
                        <div 
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            input?.showPicker?.();
                          }}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                      <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Select Time
                      </label>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-4 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600 text-sm">Loading available slots...</span>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <select
                          id="time"
                          name="time"
                          required
                          value={formData.time}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="">Choose a time slot...</option>
                          {availableSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      ) : formData.doctorId && formData.date ? (
                        <div className="text-center py-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No available slots for this date. Please select another date.
                        </div>
                      ) : (
                        <div className="text-center py-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Please select a doctor and date to see available time slots.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Any additional information, symptoms, or special requests..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 -mx-8 -mb-8 px-8 py-6 rounded-b-xl">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.doctorId || !formData.time}
                      className={`px-8 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                        loading || !formData.doctorId || !formData.time 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating Appointment...
                        </div>
                      ) : (
                        'Book Appointment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointment;