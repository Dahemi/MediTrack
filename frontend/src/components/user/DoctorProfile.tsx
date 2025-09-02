import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getMyDoctorProfile, updateMyDoctorProfile, getCurrentUser } from '../../services/api';
import type { DoctorData, DoctorAvailability } from '../../services/api';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeader from './DoctorHeader';
import ConfirmationModal from '../common/ConfirmationModal';

const doctorValidationSchema = Yup.object({
  fullName: Yup.string().required("Full name is required"),
  specialization: Yup.string().required("Specialization is required"),
  yearsOfExperience: Yup.number()
    .min(0, "Must be 0 or more")
    .required("Years of experience is required"),
  contactDetails: Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().required("Phone is required"),
  }),
  profilePictureUrl: Yup.string().url("Invalid URL").optional(),
  availability: Yup.array()
    .of(
      Yup.object({
        date: Yup.string().required("Date is required"),
        startTime: Yup.string()
          .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format (e.g., 09:00)")
          .required("Start time is required"),
        endTime: Yup.string()
          .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format (e.g., 09:00)")
          .required("End time is required"),
      })
    ),
});

const DoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    // Check if user is a doctor
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    fetchDoctorProfile();
  }, [navigate]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await getMyDoctorProfile();
      setDoctor(response.data?.doctor || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateSlots = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return Math.floor(diffMinutes / 30);
  };

  const handleSubmit = async (values: DoctorData) => {
    try {
      setError('');
      setSuccess('');
      
      // Convert date fields to ISO string for backend
      const normalizedValues = {
        ...values,
        availability: values.availability.map((a) => ({
          ...a,
          date: a.date ? new Date(a.date).toISOString() : "",
        })),
      };

      const response = await updateMyDoctorProfile(normalizedValues);
      setSuccess('Profile updated successfully!');
      
      // Update the local state with the response data instead of refetching
      if (response.data?.doctor) {
        setDoctor(response.data.doctor);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleAvailabilityUpdate = async (updatedValues: DoctorData) => {
    try {
      setAvailabilityLoading(true);
      setError('');
      
      // Convert date fields to ISO string for backend
      const normalizedValues = {
        ...updatedValues,
        availability: updatedValues.availability.map((a) => ({
          ...a,
          date: a.date ? new Date(a.date).toISOString() : "",
        })),
      };

      const response = await updateMyDoctorProfile(normalizedValues);
      setSuccess('Availability updated successfully!');
      
      // Update the local state with the response data
      if (response.data?.doctor) {
        setDoctor(response.data.doctor);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-white py-12 px-8 shadow-xl rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Profile Not Found</h2>
            <p className="text-gray-600 mb-6">Please contact an administrator to set up your doctor profile.</p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                <p className="font-semibold">Error Details:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Retry
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="flex h-screen">
        <DoctorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DoctorHeader doctor={doctor || undefined} />
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  {success}
                </div>
              )}

              {/* Profile Form */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
                <Formik
                  initialValues={{
                    ...doctor,
                    availability: doctor?.availability?.map(a => ({
                      ...a,
                      date: a.date ? new Date(a.date).toISOString().split('T')[0] : ""
                    })) || []
                  }}
                  validationSchema={doctorValidationSchema}
                  onSubmit={handleSubmit}
                  key={doctor?._id || 'new'}
                >
                  {({ values, isSubmitting, isValid, dirty, setFieldValue }) => (
                    <Form className="space-y-6">
                      {/* Form Header */}
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
                          <p className="text-gray-600">Update your professional information and availability</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                              <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            Full Name
                          </label>
                          <Field 
                            name="fullName" 
                            type="text" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                          />
                          <ErrorMessage name="fullName" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                          <Field 
                            name="specialization" 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <ErrorMessage name="specialization" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                          <Field 
                            name="yearsOfExperience" 
                            type="number" 
                            min={0} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <ErrorMessage name="yearsOfExperience" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture URL</label>
                          <Field 
                            name="profilePictureUrl" 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <ErrorMessage name="profilePictureUrl" component="div" className="text-sm text-red-600 mt-1" />
                          {values.profilePictureUrl && (
                            <img 
                              src={values.profilePictureUrl} 
                              alt="Profile" 
                              className="mt-2 w-16 h-16 rounded-full object-cover border" 
                            />
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                          <Field 
                            name="contactDetails.email" 
                            type="email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <ErrorMessage name="contactDetails.email" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                          <Field 
                            name="contactDetails.phone" 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <ErrorMessage name="contactDetails.phone" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                      </div>

                      {/* Availability */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                          <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                            <svg className="w-2 h-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          Availability Schedule
                          {availabilityLoading && (
                            <span className="ml-2 inline-flex items-center text-blue-600 text-xs">
                              <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                              Updating...
                            </span>
                          )}
                        </label>
                        <FieldArray name="availability">
                          {({ remove, push }) => (
                            <div className="space-y-4">
                              {values.availability.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-gray-500 font-medium mb-3">No availability set</p>
                                  <button 
                                    type="button" 
                                    onClick={() => push({ date: "", startTime: "", endTime: "" })} 
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                  >
                                    + Add Availability
                                  </button>
                                </div>
                              ) : (
                                values.availability.map((a, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <div className="relative">
                                      <Field 
                                        name={`availability.${idx}.date`} 
                                        type="date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                                          // Force calendar to open on focus
                                          e.target.showPicker?.();
                                        }}
                                      />
                                      <div 
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                          input?.showPicker?.();
                                        }}
                                      >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    </div>
                                    <ErrorMessage name={`availability.${idx}.date`} component="div" className="text-xs text-red-600 mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <Field 
                                      name={`availability.${idx}.startTime`} 
                                      type="text"
                                      placeholder="09:00"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                    <div className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 09:00)</div>
                                    <ErrorMessage name={`availability.${idx}.startTime`} component="div" className="text-xs text-red-600 mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <Field 
                                      name={`availability.${idx}.endTime`} 
                                      type="text"
                                      placeholder="17:00"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                    <div className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 17:00)</div>
                                    <ErrorMessage name={`availability.${idx}.endTime`} component="div" className="text-xs text-red-600 mt-1" />
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <div>Slots: {calculateSlots(a.startTime, a.endTime)}</div>
                                    <div className="text-xs text-gray-500">(30-min intervals)</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {a.date ? new Date(a.date).toLocaleDateString() : 'No date set'}
                                    </div>
                                  </div>
                                  <div>
                                    <button 
                                      type="button" 
                                      disabled={availabilityLoading}
                                      onClick={() => {
                                        const dateStr = a.date ? new Date(a.date).toLocaleDateString() : 'this availability';
                                        setConfirmationModal({
                                          isOpen: true,
                                          message: `Are you sure you want to remove ${dateStr}?`,
                                          onConfirm: () => {
                                            const newAvailability = values.availability.filter((_, index) => index !== idx);
                                            setFieldValue('availability', newAvailability);
                                            
                                            // Auto-save the changes immediately after removal
                                            const updatedValues = {
                                              ...values,
                                              availability: newAvailability
                                            };
                                            
                                            // Submit the availability update automatically
                                            handleAvailabilityUpdate(updatedValues);
                                            
                                            setConfirmationModal({
                                              isOpen: false,
                                              message: "",
                                              onConfirm: null,
                                            });
                                          },
                                        });
                                      }} 
                                      className="w-full px-3 py-2 text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {availabilityLoading ? 'Removing...' : 'Remove'}
                                    </button>
                                  </div>
                                </div>
                              ))
                              )}
                              {values.availability.length > 0 && (
                                <button 
                                  type="button" 
                                  disabled={availabilityLoading}
                                  onClick={() => {
                                    const newSlot = { date: "", startTime: "", endTime: "" };
                                    push(newSlot);
                                    
                                    // Auto-save after adding new availability slot
                                    const updatedValues = {
                                      ...values,
                                      availability: [...values.availability, newSlot]
                                    };
                                    
                                    // Submit the availability update automatically
                                    handleAvailabilityUpdate(updatedValues);
                                  }} 
                                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {availabilityLoading ? 'Adding...' : '+ Add Availability'}
                                </button>
                              )}
                            </div>
                          )}
                        </FieldArray>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !isValid || !dirty}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Updating...' : 'Update Profile'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({
          isOpen: false,
          message: "",
          onConfirm: null,
        })}
        onConfirm={() => confirmationModal.onConfirm?.()}
        title="Confirm Removal"
        message={confirmationModal.message}
        confirmText="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default DoctorProfile;