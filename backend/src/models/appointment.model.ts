import { Schema, model, Document } from "mongoose";

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
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["booked", "in_session", "completed", "cancelled"],
      default: "booked",
    },
    queueNumber: { type: Number, required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema
);
