import mongoose, { Schema, Document } from "mongoose";

export interface IQueue extends Document {
  doctorId: Schema.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  status: "active" | "paused";
  createdAt: Date;
  updatedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  pauseReason?: string;
}

const queueSchema = new Schema<IQueue>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    pausedAt: {
      type: Date,
    },
    resumedAt: {
      type: Date,
    },
    pauseReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one queue per doctor per date
queueSchema.index({ doctorId: 1, date: 1 }, { unique: true });

// Index for efficient queries
queueSchema.index({ doctorId: 1, status: 1 });
queueSchema.index({ date: 1, status: 1 });

const Queue = mongoose.model<IQueue>("Queue", queueSchema);

export default Queue;
