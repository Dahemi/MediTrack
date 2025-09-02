import mongoose, { Document, Schema } from "mongoose";

export interface IAvailability {
  date: Date;  // specific date
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User model for authentication
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  contactDetails: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability: IAvailability[];
  isVerifiedDoctor: boolean; // Admin verification status
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true 
    },
    fullName: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    contactDetails: {
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    profilePictureUrl: { type: String },
    availability: { type: [AvailabilitySchema], default: [] },
    isVerifiedDoctor: { type: Boolean, default: false }, // Default to false, set to true when admin creates profile
  },
  { timestamps: true }
);

const Doctor = mongoose.model<IDoctor>("Doctor", DoctorSchema);
export default Doctor;