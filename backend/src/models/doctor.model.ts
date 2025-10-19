import mongoose, { Document, Schema } from "mongoose";

export interface IAvailability {
  day: string; // e.g., "Monday"
  date: Date;  // specific date
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slots: number;     // available slots for the day
}

export interface IDoctor extends Document {
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  contactDetails: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability: IAvailability[];
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    day: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slots: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor>(
  {
    fullName: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    contactDetails: {
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    profilePictureUrl: { type: String },
    availability: { type: [AvailabilitySchema], default: [] },
  },
  { timestamps: true }
);

const Doctor = mongoose.model<IDoctor>("Doctor", DoctorSchema);
export default Doctor;