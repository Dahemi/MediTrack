import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  getQueueStatus, 
  startQueue, 
  pauseQueue, 
  resumeQueue, 
  stopQueue, 
  callNextPatient,
  startPatientSession,
  completePatientSession,
  type QueueStatus 
} from '../../services/appointment.api';

interface QueueControlProps {
  doctorId: string;
  date: string;
}

const QueueControl: React.FC<QueueControlProps> = ({ doctorId, date }) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQueueStatus = async () => {
    try {
      const status = await getQueueStatus(doctorId, date);
      setQueueStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue status');
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [doctorId, date]);

  const handleQueueAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    setLoading(true);
    setError('');

    try {
      switch (action) {
        case 'start':
          await startQueue(doctorId, date);
          break;
        case 'pause':
          await pauseQueue(doctorId, date);
          break;
        case 'resume':
          await resumeQueue(doctorId, date);
          break;
        case 'stop':
          await stopQueue(doctorId, date);
          break;
      }
      await fetchQueueStatus();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} queue`);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    setLoading(true);
    setError('');

    try {
      await callNextPatient(doctorId, date);
      await fetchQueueStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to call next patient');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (appointmentId: string) => {
    setLoading(true);
    setError('');

    try {
      await startPatientSession(appointmentId);
      await fetchQueueStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to start patient session');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (appointmentId: string) => {
    setLoading(true);
    setError('');

    try {
      await completePatientSession(appointmentId);
      await fetchQueueStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to complete patient session');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '🟡';
      case 'stopped': return '🔴';
      default: return '⚪';
    }
  };

  if (!queueStatus) {
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

      {/* Queue Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Queue Status</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStatusIcon(queueStatus.session?.status || 'stopped')}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(queueStatus.session?.status || 'stopped')}`}>
              {queueStatus.session?.status?.toUpperCase() || 'STOPPED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{queueStatus.stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{queueStatus.stats.waiting}</div>
            <div className="text-sm text-gray-500">Waiting</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{queueStatus.stats.inSession}</div>
            <div className="text-sm text-gray-500">In Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{queueStatus.stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>

        {/* Queue Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {!queueStatus.session || queueStatus.session.status === 'stopped' ? (
            <button
              onClick={() => handleQueueAction('start')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Queue'}
            </button>
          ) : queueStatus.session.status === 'active' ? (
            <>
              <button
                onClick={() => handleQueueAction('pause')}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Pausing...' : 'Pause Queue'}
              </button>
              <button
                onClick={() => handleQueueAction('stop')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Stopping...' : 'Stop Queue'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleQueueAction('resume')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Resuming...' : 'Resume Queue'}
              </button>
              <button
                onClick={() => handleQueueAction('stop')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Stopping...' : 'Stop Queue'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Patient */}
      {queueStatus.currentPatient && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Patient</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {queueStatus.currentPatient.patientName.charAt(0)}
                </span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">{queueStatus.currentPatient.patientName}</h5>
                <p className="text-sm text-gray-600">Queue #{queueStatus.currentPatient.queueNumber}</p>
                <p className="text-sm text-gray-500">{queueStatus.currentPatient.time}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {queueStatus.currentPatient.status === 'called' && (
                <button
                  onClick={() => handleStartSession(queueStatus.currentPatient!._id)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Start Session
                </button>
              )}
              {queueStatus.currentPatient.status === 'in_session' && (
                <button
                  onClick={() => handleCompleteSession(queueStatus.currentPatient!._id)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Complete Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next Patients */}
      {queueStatus.nextPatients.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Next Patients</h4>
          <div className="space-y-3">
            {queueStatus.nextPatients.map((patient, index) => (
              <div key={patient._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {patient.patientName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{patient.patientName}</div>
                    <div className="text-sm text-gray-500">Queue #{patient.queueNumber} • {patient.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Position {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Next Button */}
      {queueStatus.session?.status === 'active' && queueStatus.nextPatients.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleCallNext}
            disabled={loading || queueStatus.currentPatient?.status === 'called'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calling...' : 'Call Next Patient'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QueueControl;
