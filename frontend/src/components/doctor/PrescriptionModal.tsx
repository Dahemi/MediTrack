import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  price: number;
}

interface PrescriptionModalProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface PrescriptionData {
  diagnosis: string;
  symptoms: string;
  notes: string;
  drugs: Drug[];
  doctorFee: number;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointmentId,
  patientId,
  patientName,
  doctorId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PrescriptionData>({
    diagnosis: '',
    symptoms: '',
    notes: '',
    drugs: [],
    doctorFee: 2000, // Default doctor fee in LKR
  });

  const [currentDrug, setCurrentDrug] = useState<Drug>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
    price: 0,
  });

  const addDrug = () => {
    if (currentDrug.name && currentDrug.dosage && currentDrug.price > 0) {
      setFormData({
        ...formData,
        drugs: [...formData.drugs, { ...currentDrug }],
      });
      // Reset current drug
      setCurrentDrug({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
        price: 0,
      });
    }
  };

  const removeDrug = (index: number) => {
    setFormData({
      ...formData,
      drugs: formData.drugs.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    const registrationFee = 1000;
    const drugsCost = formData.drugs.reduce((sum, drug) => sum + (drug.price * drug.quantity), 0);
    return registrationFee + formData.doctorFee + drugsCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.diagnosis && formData.symptoms) {
      try {
        console.log('Creating diagnosis with data:', {
          appointmentId,
          patientId,
          doctorId,
          diagnosis: formData.diagnosis,
          symptoms: formData.symptoms,
          doctorFee: formData.doctorFee,
          drugsCount: formData.drugs.length
        });

        // Import the API function dynamically
        const { createDiagnosis } = await import('../../services/diagnosis.api');
        
        const result = await createDiagnosis({
          appointmentId,
          patientId,
          doctorId,
          diagnosis: formData.diagnosis,
          symptoms: formData.symptoms,
          notes: formData.notes,
          drugs: formData.drugs,
          doctorFee: formData.doctorFee,
        });
        
        console.log('Diagnosis created successfully:', result);
        
        // Reset form
        setFormData({
          diagnosis: '',
          symptoms: '',
          notes: '',
          drugs: [],
          doctorFee: 2000,
        });
        
        alert('Prescription saved successfully!');
        onSuccess();
      } catch (error: any) {
        console.error('Failed to create diagnosis:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save prescription';
        alert(`Error: ${errorMessage}`);
      }
    } else {
      alert('Please fill in diagnosis and symptoms fields');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl z-10">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Prescribe Medicine</h3>
                <p className="text-blue-100 text-sm mt-1">Patient: {patientName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Diagnosis & Symptoms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                    placeholder="Enter diagnosis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                    placeholder="Enter symptoms..."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Any additional notes or instructions..."
                />
              </div>

              {/* Doctor Fee */}
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Consultation Fee (LKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.doctorFee}
                  onChange={(e) => setFormData({ ...formData, doctorFee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>

              {/* Add Drug Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-blue-600" />
                  Add Medication
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={currentDrug.name}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Drug name"
                  />
                  <input
                    type="text"
                    value={currentDrug.dosage}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, dosage: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Dosage (e.g., 500mg)"
                  />
                  <input
                    type="text"
                    value={currentDrug.frequency}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, frequency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Frequency (e.g., 3x daily)"
                  />
                  <input
                    type="text"
                    value={currentDrug.duration}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, duration: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Duration (e.g., 7 days)"
                  />
                  <input
                    type="number"
                    value={currentDrug.quantity}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, quantity: Number(e.target.value) })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Quantity"
                    min="1"
                  />
                  <input
                    type="number"
                    value={currentDrug.price}
                    onChange={(e) => setCurrentDrug({ ...currentDrug, price: Number(e.target.value) })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Price (LKR)"
                    min="0"
                  />
                </div>

                <button
                  type="button"
                  onClick={addDrug}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Drug to Prescription
                </button>
              </div>

              {/* Drugs List */}
              {formData.drugs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Prescription List</h4>
                  <div className="space-y-2">
                    {formData.drugs.map((drug, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{drug.name}</p>
                          <p className="text-sm text-gray-600">
                            {drug.dosage} • {drug.frequency} • {drug.duration} • Qty: {drug.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            LKR {(drug.price * drug.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDrug(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-4">Cost Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Registration Fee:</span>
                    <span className="font-medium">LKR 1,000.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Doctor Consultation:</span>
                    <span className="font-medium">LKR {formData.doctorFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medications ({formData.drugs.length} items):</span>
                    <span className="font-medium">
                      LKR {formData.drugs.reduce((sum, drug) => sum + (drug.price * drug.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-300 pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      LKR {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.diagnosis || !formData.symptoms}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Prescription & Complete Session
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default PrescriptionModal;
