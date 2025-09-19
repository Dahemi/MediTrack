import { Schema, model, Document } from "mongoose";

interface IRescheduleHistory {
  date: string;
  time: string;
}

export interface IAppointment extends Document {
  patientName: string;
  patientAddress: string;
  patientContact: string;
  doctorId: Schema.Types.ObjectId;
  doctorName?: string;
  date: string;
  time: string;
  status: "booked" | "in_session" | "completed" | "cancelled";
  queueNumber: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Cancellation fields
  cancellationReason?: string;
  cancelledBy?: 'patient' | 'doctor';
  cancelledAt?: Date;
  
  // Rescheduling fields
  rescheduledFrom?: IRescheduleHistory;
  rescheduledReason?: string;
  rescheduledAt?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientName: { type: String, required: true },
    patientAddress: { type: String, required: true },
    patientContact: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorName: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["booked", "in_session", "completed", "cancelled"],
      default: "booked",
    },
    queueNumber: { type: Number, required: true },
    notes: { type: String },

    // Cancellation fields
    cancellationReason: { type: String },
    cancelledBy: { 
      type: String,
      enum: ['patient', 'doctor']
    },
    cancelledAt: { type: Date },
    
    // Rescheduling fields
    rescheduledFrom: {
      date: String,
      time: String
    },
    rescheduledReason: { type: String },
    rescheduledAt: { type: Date }
  },
  {
    timestamps: true,
  }
);

export const Appointment = model<IAppointment>("Appointment", appointmentSchema);