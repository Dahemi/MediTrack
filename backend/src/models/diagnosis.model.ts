import { Schema, model, Document } from "mongoose";

interface IDrug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  price: number; // Price in LKR
}

export interface IDiagnosis extends Document {
  appointmentId: Schema.Types.ObjectId;
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  
  // Medical Details
  diagnosis: string;
  symptoms: string;
  notes?: string;
  
  // Prescription
  drugs: IDrug[];
  
  // Financial Details (in LKR)
  registrationFee: number; // Always 1000 LKR
  doctorFee: number; // Doctor consultation fee
  drugsCost: number; // Total cost of drugs
  totalAmount: number; // Total = registration + doctor fee + drugs
  
  // Metadata
  prescribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const drugSchema = new Schema<IDrug>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const diagnosisSchema = new Schema<IDiagnosis>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Medical Details
    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    symptoms: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    
    // Prescription
    drugs: {
      type: [drugSchema],
      default: [],
    },
    
    // Financial Details (in LKR)
    registrationFee: {
      type: Number,
      required: true,
      default: 1000, // Fixed registration fee
    },
    doctorFee: {
      type: Number,
      required: true,
      min: 0,
    },
    drugsCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    prescribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
diagnosisSchema.index({ appointmentId: 1 });
diagnosisSchema.index({ patientId: 1 });
diagnosisSchema.index({ doctorId: 1 });
diagnosisSchema.index({ prescribedAt: -1 });

// Calculate total before saving
diagnosisSchema.pre('save', function(next) {
  // Calculate drugs cost
  this.drugsCost = this.drugs.reduce((total, drug) => total + (drug.price * drug.quantity), 0);
  
  // Calculate total amount
  this.totalAmount = this.registrationFee + this.doctorFee + this.drugsCost;
  
  next();
});

const Diagnosis = model<IDiagnosis>("Diagnosis", diagnosisSchema);

export default Diagnosis;
