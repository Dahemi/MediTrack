import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { format } from "date-fns";

type Appointment = {
  _id: string;
  patientName: string;
  time: string;
  date: string;
  queueNumber: number;
  status: "booked" | "in_session" | "completed" | "cancelled";
  patientAddress?: string;
  patientContact?: string;
  notes?: string;
};

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user?.id) return;
    fetchAppointments();
  }, [user?.id, selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedDate) {
        // Fetch appointments for specific date
        response = await api.get(`/appointment/doctor/${user?.id}/date/${selectedDate}`);
      } else {
        // Fetch all appointments for the doctor
        response = await api.get(`/appointment/doctor/${user?.id}`);
      }
      setAppointments(response.data.appointments || response.data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/appointment/${id}`, { status });
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    const statusMatch = statusFilter === "all" || appointment.status === statusFilter;
    
    // Filter by date if selected
    const dateMatch = !selectedDate || appointment.date === selectedDate;
    
    return statusMatch && dateMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "in_session":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Appointments</h1>
            <p className="text-sm text-gray-600">
              {selectedDate ? `Filtered by date: ${selectedDate}` : "Showing all appointments"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedDate && (
                  <button
                    onClick={() => {
                      setSelectedDate("");
                      setStatusFilter("all");
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd"))}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  Tomorrow
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="booked">Booked</option>
                <option value="in_session">In Session</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No appointments found for the selected date and status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{appointment.queueNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                        {appointment.patientAddress && (
                          <div className="text-sm text-gray-500">{appointment.patientAddress}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.patientContact || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {appointment.status === "booked" && (
                        <button
                          onClick={() => handleStatusChange(appointment._id, "in_session")}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Start Session
                        </button>
                      )}
                      {appointment.status === "in_session" && (
                        <button
                          onClick={() => handleStatusChange(appointment._id, "completed")}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Mark Completed
                        </button>
                      )}
                      {appointment.status === "booked" && (
                        <button
                          onClick={() => handleStatusChange(appointment._id, "cancelled")}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
