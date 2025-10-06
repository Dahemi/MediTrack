import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

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

type DayStats = {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  revenue: number;
};

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (!user?.id) return;
    fetchAppointments();
  }, [user?.id, selectedPeriod]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch all appointments for analytics
      const response = await api.get(`/appointment/doctor/${user?.id}`);
      const allAppointments = response.data.appointments || response.data.data || [];
      setAppointments(allAppointments);
      
      // Calculate week stats
      calculateWeekStats(allAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeekStats = (allAppointments: Appointment[]) => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const stats = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = allAppointments.filter(app => app.date === dayStr);
      
      return {
        date: dayStr,
        total: dayAppointments.length,
        completed: dayAppointments.filter(app => app.status === 'completed').length,
        cancelled: dayAppointments.filter(app => app.status === 'cancelled').length,
        revenue: dayAppointments.filter(app => app.status === 'completed').length * 50, // Assuming $50 per appointment
      };
    });
    
    setWeekStats(stats);
  };

  // Calculate overall statistics
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
  const cancelledAppointments = appointments.filter(app => app.status === 'cancelled').length;
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(1) : '0';
  const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments * 100).toFixed(1) : '0';
  
  // Recent appointments (last 7 days)
  const recentAppointments = appointments
    .filter(app => {
      const appointmentDate = new Date(app.date);
      const sevenDaysAgo = subDays(new Date(), 7);
      return appointmentDate >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Top patients (most frequent)
  const patientFrequency = appointments.reduce((acc, app) => {
    acc[app.patientName] = (acc[app.patientName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topPatients = Object.entries(patientFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked": return "bg-blue-100 text-blue-800";
      case "in_session": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const maxWeeklyTotal = Math.max(...weekStats.map(day => day.total), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Analytics & Insights</h1>
        <p className="text-lg text-gray-600">
          Understand your practice patterns, patient trends, and performance metrics
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
                  <p className="text-2xl font-bold text-red-600">{cancellationRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Patients</p>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(patientFrequency).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">This Week</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {weekStats.map((day, index) => (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {format(new Date(day.date), 'EEE')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(day.total / maxWeeklyTotal) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 w-12 text-right">
                        {day.total}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>✅ {day.completed} completed</span>
                      <span>❌ {day.cancelled} cancelled</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent appointments</p>
                ) : (
                  recentAppointments.map((appointment) => (
                    <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {appointment.patientName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.date} at {appointment.time}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Patients */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Frequent Patients</h3>
              <div className="space-y-3">
                {topPatients.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No patient data available</p>
                ) : (
                  topPatients.map(([patientName, count], index) => (
                    <div key={patientName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {index < 3 ? (
                            <StarIcon className={`h-5 w-5 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 'text-yellow-600'
                            }`} />
                          ) : (
                            <span className="text-gray-400 font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{patientName}</div>
                          <div className="text-xs text-gray-500">{count} appointments</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        {count}x
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📈 Efficiency</h4>
                <p className="text-sm text-gray-600">
                  Your completion rate of {completionRate}% is {parseFloat(completionRate) > 85 ? 'excellent' : parseFloat(completionRate) > 70 ? 'good' : 'needs improvement'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">👥 Patient Loyalty</h4>
                <p className="text-sm text-gray-600">
                  {topPatients.length > 0 ? `${topPatients[0][1]} visits from your top patient shows strong loyalty` : 'Building patient relationships'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📅 Scheduling</h4>
                <p className="text-sm text-gray-600">
                  {cancellationRate}% cancellation rate - {parseFloat(cancellationRate) < 10 ? 'excellent scheduling' : 'consider reminder systems'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;