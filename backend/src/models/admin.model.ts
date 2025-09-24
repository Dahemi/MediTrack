import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: "admin";
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ["admin"],
      required: true,
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
