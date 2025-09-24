import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  userType: "patient" | "doctor" | "admin";
  firebaseUid?: string;
  photoURL?: string;
  isVerified: boolean;
  // Doctor-specific fields
  fullName?: string;
  specialization?: string;
  yearsOfExperience?: number;
  contactDetails?: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability?: Array<{
    day: string;
    date: string;
    startTime: string;
    endTime: string;
    slots: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    userType: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
      default: "patient",
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    photoURL: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Doctor-specific fields
    fullName: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    contactDetails: {
      email: {
        type: String,
        lowercase: true,
      },
      phone: {
        type: String,
      },
    },
    profilePictureUrl: {
      type: String,
    },
    availability: [
      {
        day: String,
        date: String, // Store as YYYY-MM-DD format to avoid timezone issues
        startTime: String,
        endTime: String,
        slots: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ userType: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
