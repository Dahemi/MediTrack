import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  createDoctor,
  getDoctors,
  updateDoctor,
  deleteDoctor,
  getCurrentUser,
  getUsersByRole,
} from "../../services/api";
import type { DoctorData, DoctorAvailability, UserData, UserManagementData } from "../../services/api";
import Sidebar from "../../components/admin/Sidebar";
import Header from "../../components/admin/Header";
import DeleteConfirmationModal from "../../components/admin/DeleteConfirmationModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";

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

const initialDoctor: DoctorData = {
  fullName: "",
  specialization: "",
  yearsOfExperience: 0,
  contactDetails: { email: "", phone: "" },
  profilePictureUrl: "",
  availability: [],
};

const DoctorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [usersWithDoctorRole, setUsersWithDoctorRole] = useState<UserManagementData[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<DoctorData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    doctorId: string | null;
    doctorName: string;
  }>({
    isOpen: false,
    doctorId: null,
    doctorName: "",
  });
  
  // Confirmation modal state for availability removal
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  // Get selected user data for pre-filling form
  const selectedUser = usersWithDoctorRole.find(u => u._id === selectedUserId);

  useEffect(() => {
    // Check authentication and role
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    setCurrentUser(user);
    fetchDoctors();
    fetchUsersWithDoctorRole();
  }, [navigate]);

  const calculateSlots = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return Math.floor(diffMinutes / 30);
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await getDoctors();
      const doctorsData = res.data?.doctors || [];
      setDoctors(doctorsData);
    } catch (e: any) {
      setStatus({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithDoctorRole = async () => {
    try {
      const res = await getUsersByRole('doctor');
      const usersData = res.data?.users || [];
      setUsersWithDoctorRole(usersData);
    } catch (e: any) {
    }
  };

  const handleDelete = (id?: string, name?: string) => {
    if (!id) return;
    
    // Open the delete confirmation modal
    setDeleteModal({
      isOpen: true,
      doctorId: id,
      doctorName: name || "this doctor",
    });
  };

  const handleDeleteConfirm = async (deleteUser?: boolean) => {
    if (!deleteModal.doctorId) return;
    
    try {
      // Pass the deleteUser flag to the backend
      const queryParams = deleteUser ? '?deleteUser=true' : '';
      await deleteDoctor(deleteModal.doctorId + queryParams);
      
      const message = deleteUser 
        ? "Doctor profile and user account deleted successfully" 
        : "Doctor profile deleted successfully";
      
      setStatus({ type: "success", message });
      fetchDoctors();
    } catch (e: any) {
      setStatus({ type: "error", message: e.message });
    } finally {
      // Close the modal
      setDeleteModal({
        isOpen: false,
        doctorId: null,
        doctorName: "",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      doctorId: null,
      doctorName: "",
    });
  };

  // Helper to convert date fields to ISO string for backend
  const normalizeDoctor = (values: DoctorData): DoctorData => {
    return {
      ...values,
      availability: values.availability.map((a) => ({
          ...a,
          date: a.date ? new Date(a.date).toISOString() : "",
      })),
    };
  };

  // Handle availability updates with auto-save
  const handleAvailabilityUpdate = async (updatedValues: DoctorData, isEditing: boolean) => {
    try {
      setAvailabilityLoading(true);
      setStatus({ type: null, message: "" });
      
      const normalized = normalizeDoctor(updatedValues);
      
      if (isEditing && editingDoctor?._id) {
        // Update existing doctor
        await updateDoctor(editingDoctor._id, normalized);
        setStatus({ type: "success", message: "Availability updated successfully" });
        
        // Update the editing doctor state
        setEditingDoctor(normalized);
      } else if (selectedUserId) {
        // Update the form values for new doctor creation
        // This will be saved when the form is submitted
        setStatus({ type: "success", message: "Availability updated in form" });
      }
      
      // Refresh the doctors list to show updated data
      await fetchDoctors();
    } catch (e: any) {
      setStatus({ type: "error", message: e.message || "Failed to update availability" });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Get users who need doctor profiles (users with doctor role but no verified doctor profile)
  const getUsersNeedingDoctorProfiles = () => {
    // Get verified doctor user IDs
    const verifiedDoctorUserIds = doctors
      .filter(d => d.isVerifiedDoctor)
      .map(d => {
        // Handle both cases: userId as string ID or as populated object
        if (typeof d.userId === 'string') {
          return d.userId;
        } else if (d.userId && typeof d.userId === 'object' && '_id' in d.userId) {
          return (d.userId as any)._id;
        } else {
          return String(d.userId);
        }
      })
      .filter(Boolean);
    
    const usersNeedingProfiles = usersWithDoctorRole.filter(user => {
      const userIdString = String(user._id);
      const hasVerifiedProfile = verifiedDoctorUserIds.some(doctorUserId => {
        const doctorUserIdString = String(doctorUserId);
        return doctorUserIdString === userIdString;
      });
      
      return !hasVerifiedProfile;
    });
    
    return usersNeedingProfiles;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} />
        
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
              <p className="text-gray-600">Manage doctors in the MediTrack system</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Doctors</h3>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{doctors.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verified Doctors</h3>
                      <p className="mt-1 text-3xl font-bold text-green-600">{doctors.filter(d => d.isVerifiedDoctor).length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Pending Verification</h3>
                      <p className="mt-1 text-3xl font-bold text-yellow-600">{doctors.filter(d => !d.isVerifiedDoctor).length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Users Needing Profiles</h3>
                      <p className="mt-1 text-3xl font-bold text-blue-600">{getUsersNeedingDoctorProfiles().length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
            </div>

            {/* Status Message */}
            {status.type && (
                <div className={`p-4 rounded-lg flex items-center ${
                  status.type === "success" 
                    ? "bg-green-50 border border-green-200 text-green-800" 
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    status.type === "success" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            {/* Users Needing Doctor Profiles */}
              <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Users Needing Doctor Profiles</h3>
                </div>
              {getUsersNeedingDoctorProfiles().length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">All users with doctor role have profiles created.</p>
                  </div>
              ) : (
                <div className="space-y-3">
                  {getUsersNeedingDoctorProfiles().map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-yellow-600 font-medium">Needs doctor profile setup</p>
                      </div>
                      <button
                        onClick={() => setSelectedUserId(user._id)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        Create Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Form */}
              <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
              {selectedUserId && !editingDoctor && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <p className="text-sm text-blue-800">
                    <strong>Creating profile for:</strong> {usersWithDoctorRole.find(u => u._id === selectedUserId)?.name} ({usersWithDoctorRole.find(u => u._id === selectedUserId)?.email})
                  </p>
                </div>
              )}
                             <Formik
                 initialValues={
                   (() => {
                     const initialValues = editingDoctor || 
                       (selectedUser ? {
                         ...initialDoctor,
                         fullName: selectedUser.name,
                         contactDetails: {
                           ...initialDoctor.contactDetails,
                           email: selectedUser.email
                         }
                       } : initialDoctor);
                     
                     // Convert dates to YYYY-MM-DD format for form inputs
                     if (initialValues.availability) {
                       initialValues.availability = initialValues.availability.map(a => ({
                         ...a,
                         date: a.date ? new Date(a.date).toISOString().split('T')[0] : ""
                       }));
                     }
                     
                     return initialValues;
                   })()
                 }
                  key={editingDoctor?._id || selectedUserId || 'new'}
                validationSchema={doctorValidationSchema}
                                 onSubmit={async (values, { resetForm }) => {
                   try {
                     const normalized = normalizeDoctor(values);
                     
                     if (editingDoctor && editingDoctor._id) {
                        await updateDoctor(editingDoctor._id, normalized);
                       setStatus({ type: "success", message: "Doctor updated successfully" });
                     } else {
                       // Add userId when creating new doctor profile
                       const doctorData = { ...normalized, userId: selectedUserId };
                       await createDoctor(doctorData);
                       setStatus({ type: "success", message: "Doctor created successfully" });
                       setSelectedUserId(""); // Clear selection after creation
                     }
                     setEditingDoctor(null);
                     resetForm();
                     
                     // Refresh both lists to update the UI
                     await fetchDoctors();
                     await fetchUsersWithDoctorRole();
                   } catch (e: any) {
                     setStatus({ type: "error", message: e.message || "Failed to create doctor" });
                   }
                 }}
              >
                {({ values, isSubmitting, isValid, dirty, setFieldValue }) => (
                  <Form className="space-y-6">
                    {!selectedUserId && !editingDoctor && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">Select a user above to create a doctor profile, or edit an existing doctor below.</p>
                      </div>
                    )}
                    {(selectedUserId || editingDoctor) && (
                      <>
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
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                Specialization
                              </label>
                              <Field 
                                name="specialization" 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                              />
                              <ErrorMessage name="specialization" component="div" className="text-sm text-red-600 mt-1" />
                          </div>
                            
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                Years of Experience
                              </label>
                              <Field 
                                name="yearsOfExperience" 
                                type="number" 
                                min={0} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                              />
                              <ErrorMessage name="yearsOfExperience" component="div" className="text-sm text-red-600 mt-1" />
                          </div>
                            
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                Profile Picture URL
                              </label>
                              <Field 
                                name="profilePictureUrl" 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
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
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                  </svg>
                                </div>
                                Email
                              </label>
                              <Field 
                                name="contactDetails.email" 
                                type="email" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                              />
                              <ErrorMessage name="contactDetails.email" component="div" className="text-sm text-red-600 mt-1" />
                            </div>
                            
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                Phone
                              </label>
                              <Field 
                                name="contactDetails.phone" 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                              />
                              <ErrorMessage name="contactDetails.phone" component="div" className="text-sm text-red-600 mt-1" />
                            </div>
                          </div>

                          {/* Availability Section */}
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
                              {({ push, remove }) => (
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
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                         />
                                         <div 
                                              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                           onClick={(e) => {
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
                                               const isEditing = !!editingDoctor;
                                               handleAvailabilityUpdate(updatedValues, isEditing);
                                               
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
                                    const isEditing = !!editingDoctor;
                                    handleAvailabilityUpdate(updatedValues, isEditing);
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
                          <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {isSubmitting ? "Creating..." : (editingDoctor ? "Update Doctor" : "Create Doctor")}
                          </button>
                          {editingDoctor && (
                            <button
                              type="button"
                              onClick={() => setEditingDoctor(null)}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </Form>
                )}
              </Formik>
            </div>

            {/* Doctor List */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Doctors List</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {doctors.length} doctors
                    </span>
                  </div>
                </div>
              {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading doctors...</p>
                  </div>
              ) : doctors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No doctors found.</p>
                  </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Specialization</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Experience</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {doctors.map((doc) => (
                          <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 flex items-center space-x-3">
                            {doc.profilePictureUrl && (
                                <img src={doc.profilePictureUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border" />
                            )}
                              <span className="font-medium text-gray-900">{doc.fullName}</span>
                          </td>
                            <td className="px-6 py-4 text-gray-900">{doc.specialization}</td>
                            <td className="px-6 py-4 text-gray-900">{doc.yearsOfExperience} yrs</td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{doc.contactDetails.email}</div>
                              <div className="text-sm text-gray-500">{doc.contactDetails.phone}</div>
                          </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              doc.isVerifiedDoctor 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.isVerifiedDoctor ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                            <td className="px-6 py-4 space-x-3">
                            <button
                              onClick={() => setEditingDoctor(doc)}
                                className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                            >
                              Edit
                            </button>
                                                         <button
                               onClick={() => handleDelete(doc._id, doc.fullName)}
                                 className="text-red-600 hover:text-red-900 font-medium transition-colors"
                             >
                               Delete
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
             </div>
           </div>
         </main>
       </div>
     </div>
     
     {/* Delete Confirmation Modal */}
     <DeleteConfirmationModal
       isOpen={deleteModal.isOpen}
       onClose={handleDeleteCancel}
       onConfirm={handleDeleteConfirm}
       title="Delete Doctor"
       message="Choose deletion scope"
       itemName={deleteModal.doctorName}
       itemType="Doctor"
       userRole="doctor"
     />
     
     {/* Confirmation Modal for availability removal */}
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

export default DoctorManagement;