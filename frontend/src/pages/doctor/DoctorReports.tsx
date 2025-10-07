import React from "react";

const DoctorReports: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Reports</h1>
        <p className="text-lg text-gray-600">This page will show doctor's reports and analytics.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">This page will show doctor's reports and analytics.</p>
      </div>
    </div>
  );
};

export default DoctorReports;
