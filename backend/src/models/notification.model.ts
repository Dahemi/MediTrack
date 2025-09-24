import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
  patientId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'appointment' | 'queue' | 'system';
  status: 'unread' | 'read';
  queueData?: {
    currentQueue: number;
    yourQueue: number;
    estimatedTime: number;
  };
  appointmentId?: Schema.Types.ObjectId;
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['appointment', 'queue', 'system'],
      required: true
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread'
    },
    queueData: {
      currentQueue: Number,
      yourQueue: Number,
      estimatedTime: Number
    },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    readAt: { type: Date },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);