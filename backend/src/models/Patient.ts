import mongoose, { Document, Schema } from "mongoose";

export interface IPatient extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken: string | undefined;
  verificationTokenExpires: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Index for faster email lookups
PatientSchema.index({ email: 1 });
PatientSchema.index({ verificationToken: 1 });

// Remove password from JSON output
PatientSchema.methods.toJSON = function () {
  const patient = this.toObject();
  delete patient.password;
  delete patient.verificationToken;
  delete patient.verificationTokenExpires;
  return patient;
};

const Patient = mongoose.model<IPatient>("Patient", PatientSchema);
export default Patient;
