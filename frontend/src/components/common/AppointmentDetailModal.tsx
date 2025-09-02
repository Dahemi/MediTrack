import React from 'react';
import { format } from 'date-fns';
import type { AppointmentData } from '../../services/appointment.api';

interface AppointmentDetailModalProps {
  appointment: AppointmentData | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'patient' | 'doctor';
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  userRole
}) => {
  if (!isOpen || !appointment) return null;

  const formattedDate = format(new Date(appointment.date), 'MMMM d, yyyy');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold">
                  {userRole === 'patient' ? 'Appointment Details' : 'Patient Appointment'}
                </h1>
                <p className="text-blue-100">
                  {userRole === 'patient' 
                    ? 'Your appointment details' 
                    : 'Patient appointment information'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {userRole === 'patient' ? 'Doctor' : 'Patient'}
                </p>
                <p className="font-semibold text-gray-900">
                  {userRole === 'patient' 
                    ? appointment.doctorId?.name || 'Unknown Doctor'
                    : appointment.patientId?.name || 'Unknown Patient'
                  }
                </p>
                {userRole === 'patient' && appointment.doctorId?.specialization && (
                  <p className="text-sm text-gray-600">{appointment.doctorId.specialization}</p>
                )}
                {userRole === 'doctor' && appointment.patientId?.email && (
                  <p className="text-sm text-gray-600">{appointment.patientId.email}</p>
                )}
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500">Queue Number</p>
                <p className="text-2xl font-bold text-blue-600">#{appointment.queueNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{formattedDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">{appointment.time}</p>
              </div>
            </div>

            {appointment.notes && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              appointment.status === 'booked' ? 'bg-green-100 text-green-800' :
              appointment.status === 'in_session' ? 'bg-blue-100 text-blue-800' :
              appointment.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => {/* Add to calendar logic */}}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Add to Calendar</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Close
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              {userRole === 'patient' 
                ? `Appointment with Dr. ${appointment.doctorId?.name || 'Unknown'}`
                : `Appointment with ${appointment.patientId?.name || 'Unknown Patient'}`
              }
            </p>
            <p className="mt-1">Please arrive 10 minutes before your scheduled time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
