import { Schema, model, Document } from "mongoose";
//import { User } from "./user.model.js";

interface IRescheduleHistory {
  date: string;
  time: string;
}

export interface IAppointment extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
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
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // e.g. "2025-08-25"
    time: { type: String, required: true }, // e.g. "10:30"
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

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema
);