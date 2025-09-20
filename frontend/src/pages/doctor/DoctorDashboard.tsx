import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { format } from "date-fns";

type Appointment = {
  _id: string;
  patientName: string;
  time: string;
  queueNumber: number;
  status: "booked" | "in_session" | "completed" | "cancelled";
};

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
 const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api
      .get(`/appointment/doctor/${user.id}/date/${selectedDate}`)
      .then((res) => setAppointments(res.data.appointments || []))
      .finally(() => setLoading(false));
  }, [selectedDate, user?.id]);

  const handleStatusChange = async (id: string, status: string) => {
    await api.put(`/appointment/${id}`, { status });
    if (!user?.id) return;
    const res = await api.get(`/appointment/doctor/${user.id}/date/${selectedDate}`);
    setAppointments(res.data.appointments || []);
  };

const inSession = appointments.find((a) => a.status === "in_session");
const nextInQueue = appointments.find(
  (a) => a.status === "booked" && (!inSession || a.queueNumber > inSession.queueNumber)
);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Dr. {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.specialization}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, Dr. {user?.name}!
          </h2>
          <p className="text-gray-600">
            Manage your appointments, patients, and medical practice from your
            dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Appointments
                </p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Patients
                </p>
                <p className="text-2xl font-semibold text-gray-900">247</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Reviews
                </p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Add New Appointment
                  </span>
                </div>
              </button>

              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    View Patient Records
                  </span>
                </div>
              </button>

              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Update Availability
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">
                    Appointment with John Doe completed
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">
                    New appointment scheduled
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">
                    Patient record updated
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Schedule
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">Regular Checkup</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">9:00 AM</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmed
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">
                    SM
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sarah Miller
                  </p>
                  <p className="text-xs text-gray-500">Follow-up</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">10:30 AM</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Full Schedule →
            </button>
          </div>
        </div>
        {/* Appointment Queue Management */}
        <div className="bg-white rounded-lg shadow-xl border border-blue-100 p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-7 h-7 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Appointment Queue
          </h3>
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center text-blue-600 py-12">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No appointments for this date.</div>
          ) : (
            <div className="space-y-6">
              {/* Current Session */}
              {inSession && (
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-800 mb-1">In Session</div>
                    <div className="font-semibold text-gray-900 text-xl">{inSession.patientName}</div>
                    <div className="text-sm text-gray-600">Time: {inSession.time}</div>
                  </div>
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={() => handleStatusChange(inSession._id, "completed")}
                  >
                    Mark Completed
                  </button>
                </div>
              )}
              {/* Next in Queue */}
              {nextInQueue && !inSession && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-800 mb-1">Next in Queue</div>
                    <div className="font-semibold text-gray-900 text-xl">{nextInQueue.patientName}</div>
                    <div className="text-sm text-gray-600">Time: {nextInQueue.time}</div>
                  </div>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    onClick={() => handleStatusChange(nextInQueue._id, "in_session")}
                  >
                    Start Session
                  </button>
                </div>
              )}
              {/* Full Queue List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Queue</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Patient</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a._id} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-2 font-bold text-blue-700">{a.queueNumber}</td>
                        <td className="px-4 py-2 font-semibold text-gray-900">{a.patientName}</td>
                        <td className="px-4 py-2 text-gray-700">{a.time}</td>
                        <td className="px-4 py-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.status === "in_session"
                              ? "bg-green-100 text-green-800"
                              : a.status === "completed"
                              ? "bg-yellow-100 text-yellow-800"
                              : a.status === "booked"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {a.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {a.status === "booked" && !inSession && (
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg text-xs font-semibold"
                              onClick={() => handleStatusChange(a._id, "in_session")}
                            >
                              Start Session
                            </button>
                          )}
                          {a.status === "in_session" && (
                            <button
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded-lg text-xs font-semibold"
                              onClick={() => handleStatusChange(a._id, "completed")}
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
