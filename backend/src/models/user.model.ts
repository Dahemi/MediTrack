import mongoose, { Document, Schema } from "mongoose";

export interface IAvailability {
  day: string;
  date: Date;
  startTime: string;
  endTime: string;
  slots: number;
}

export interface IUser extends Document {
  // Common fields for all user types
  name: string;
  email: string;
  password: string;
  userType: "patient" | "doctor" | "admin";
  isVerified: boolean;
  verificationToken: string | undefined;
  verificationTokenExpires: Date | undefined;

  // Doctor-specific fields (optional for other types)
  fullName?: string;
  specialization?: string;
  yearsOfExperience?: number;
  contactDetails?: {
    email: string;
    phone: string;
  };
  profilePictureUrl?: string;
  availability?: IAvailability[];

  // Admin-specific fields (optional)
  role?: string;
  permissions?: string[];

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

const UserSchema: Schema = new Schema(
  {
    // Common fields
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    userType: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
      default: "patient",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: undefined,
    },
    verificationTokenExpires: {
      type: Date,
      default: undefined,
    },

    // Doctor-specific fields
    fullName: {
      type: String,
      trim: true,
      required: function (this: IUser) {
        return this.userType === "doctor";
      },
    },
    specialization: {
      type: String,
      trim: true,
      required: function (this: IUser) {
        return this.userType === "doctor";
      },
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      required: function (this: IUser) {
        return this.userType === "doctor";
      },
    },
    contactDetails: {
      email: {
        type: String,
        trim: true,
        required: function (this: IUser) {
          return this.userType === "doctor";
        },
      },
      phone: {
        type: String,
        trim: true,
        required: function (this: IUser) {
          return this.userType === "doctor";
        },
      },
    },
    profilePictureUrl: { type: String },
    availability: {
      type: [AvailabilitySchema],
      default: [],
    },

    // Admin-specific fields
    role: {
      type: String,
      default: "admin",
      required: function (this: IUser) {
        return this.userType === "admin";
      },
    },
    permissions: {
      type: [String],
      default: ["read", "write", "delete"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ userType: 1, isVerified: 1 }); // Compound index for filtering

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.verificationTokenExpires;
  return user;
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
