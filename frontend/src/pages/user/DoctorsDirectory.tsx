import React, { useEffect, useState } from "react";
import { getDoctors } from "../../services/api";
import type { DoctorData} from "../../services/api";
import Navbar from "../../components/user/Navbar";
import Footer from "../../components/Footer"; // Create this if not present

const DoctorsDirectory: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [filtered, setFiltered] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDoctors()
      .then((res) => setDoctors(res.doctors || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = doctors;
    if (search.trim()) {
      result = result.filter((doc) =>
        doc.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (specialization.trim()) {
      result = result.filter((doc) =>
        doc.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, specialization, doctors]);

  // Get unique specializations for filter dropdown
  const specializations = Array.from(
    new Set(doctors.map((doc) => doc.specialization))
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />
      <header className="bg-white shadow py-8 mb-6">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find a Doctor</h1>
          <p className="text-gray-600 text-lg">
            Search and filter our experienced doctors by name or specialization.
          </p>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto px-4">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter doctor's name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Specialization</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctors List */}
        {loading ? (
          <div className="text-center text-blue-600 py-12">Loading doctors...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No doctors found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-shadow"
              >
                <img
                  src={doc.profilePictureUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(doc.fullName)}
                  alt={doc.fullName}
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{doc.fullName}</h2>
                  <div className="text-blue-600 font-semibold">{doc.specialization}</div>
                  <div className="text-gray-700 mt-2">
                    {doc.yearsOfExperience} years experience
                  </div>
                  <div className="text-gray-500 mt-1 text-sm">
                    Contact: {doc.contactDetails.email} | {doc.contactDetails.phone}
                  </div>
                  <div className="mt-2 text-gray-600 text-sm">
                    {/* Description based on experience */}
                    {doc.yearsOfExperience >= 10
                      ? `A highly experienced ${doc.specialization} with a decade of dedication to patient care.`
                      : `Dedicated ${doc.specialization} with ${doc.yearsOfExperience} years of experience.`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DoctorsDirectory;