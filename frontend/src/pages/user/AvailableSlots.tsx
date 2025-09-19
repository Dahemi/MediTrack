import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMinutes, parseISO } from "date-fns";
import type { DoctorData } from "../../services/api";
import Navbar from "../../components/user/Navbar";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

function getSlotsForDay(
  availability: { date: string; startTime: string; endTime: string; slots: number }[],
  dateStr: string
) {
  const avail = availability.find(a => format(parseISO(a.date), "yyyy-MM-dd") === dateStr);
  if (!avail) return [];
  const slots = [];
  let start = parseISO(`${dateStr}T${avail.startTime}`);
  const end = parseISO(`${dateStr}T${avail.endTime}`);
  for (let i = 0; i < avail.slots; i++) {
    const slotTime = addMinutes(start, i * 30);
    if (slotTime >= end) break;
    slots.push(format(slotTime, "HH:mm"));
  }
  return slots;
}

const AvailableSlots: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor: DoctorData = location.state?.doctor;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Calendar days for current month
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // Get available dates from doctor's availability
  const availableDates = doctor.availability.map(a => format(parseISO(a.date), "yyyy-MM-dd"));

  // Get slots for selected day
  const slots = selectedDate ? getSlotsForDay(doctor.availability, selectedDate) : [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Slots for {doctor.fullName}</h1>
        <div className="mb-6 text-gray-600">{doctor.specialization} • {doctor.yearsOfExperience} years experience</div>
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-semibold text-gray-500">{d}</div>
            ))}
            {days.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isAvailable = availableDates.includes(dateStr);
              return (
                <button
                  key={dateStr}
                  className={`aspect-square rounded-lg text-sm font-medium border
                    ${isAvailable ? "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200" : "bg-gray-100 border-gray-200 text-gray-400"}
                    ${selectedDate === dateStr ? "ring-2 ring-blue-500" : ""}
                  `}
                  disabled={!isAvailable}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-4">
              <div className="font-semibold mb-2">Available Slots on {selectedDate}:</div>
              <div className="flex flex-wrap gap-2">
                {slots.length === 0 ? (
                  <span className="text-gray-500">No slots available</span>
                ) : (
                  slots.map(slot => (
                    <button
                      key={slot}
                      className={`px-4 py-2 rounded-lg border font-medium
                        ${selectedSlot === slot ? "bg-blue-600 text-white border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}
                      `}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 mt-4"
          disabled={!selectedDate || !selectedSlot}
          onClick={() => {
            navigate("/appointment/create", {
              state: {
                doctor: doctor,
                date: selectedDate,
                time: selectedSlot,
              },
            });
          }}
        >
          Book an Appointment
        </button>
      </main>
      <Footer />
    </div>
  );
};

export default AvailableSlots;