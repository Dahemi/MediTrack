import Queue, { IQueue } from "../models/queue.model.js";
import { Appointment } from "../models/appointment.model.js";
import User from "../models/user.model.js";
import type { Types } from "mongoose";

// Helper to normalize date to Asia/Colombo timezone in YYYY-MM-DD format
function normalizeDate(dateInput: string | Date): string {
  // If input is a date string, use it directly if it's already in YYYY-MM-DD format
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  // For Date objects, get the date in Colombo timezone
  const date = new Date(dateInput);
  
  // Get the date in Colombo timezone using Intl.DateTimeFormat
  const colomboDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  
  
  return colomboDate;
}

export interface QueueStatus {
  doctorId: string;
  date: string;
  status: "active" | "paused";
  currentAppointments: any[];
  waitingCount: number;
  pausedAt?: Date | undefined;
  pauseReason?: string | undefined;
}

export class QueueService {
  /**
   * Get or create a queue for a doctor on a specific date (idempotent upsert)
   */
  static async getOrCreateQueue(doctorId: string, date: string): Promise<IQueue> {
    try {
      const normalizedDate = normalizeDate(date);
      
      const queue = await Queue.findOneAndUpdate(
        { doctorId, date: normalizedDate },
        { $setOnInsert: { status: "active" } },
        { upsert: true, new: true }
      );
      
      return queue;
    } catch (error: any) {
      throw new Error(`Failed to get or create queue: ${error.message}`);
    }
  }

  /**
   * Pause a doctor's queue for a specific date
   */
  static async pauseQueue(
    doctorId: string, 
    date: string, 
    reason?: string
  ): Promise<IQueue> {
    try {
      const normalizedDate = normalizeDate(date);
      
      const queue = await Queue.findOneAndUpdate(
        { doctorId, date: normalizedDate },
        { 
          $set: { 
            status: "paused",
            pausedAt: new Date(),
            pauseReason: reason || "Doctor paused the queue"
          }
        },
        { new: true, upsert: true }
      );

      return queue;
    } catch (error: any) {
      throw new Error(`Failed to pause queue: ${error.message}`);
    }
  }

  /**
   * Resume a doctor's queue for a specific date
   */
  static async resumeQueue(doctorId: string, date: string): Promise<IQueue> {
    try {
      const normalizedDate = normalizeDate(date);
      
      const queue = await Queue.findOneAndUpdate(
        { doctorId, date: normalizedDate },
        { 
          $set: { 
            status: "active",
            resumedAt: new Date()
          },
          $unset: { pauseReason: "" }
        },
        { new: true, upsert: true }
      );
      
      return queue;
    } catch (error: any) {
      throw new Error(`Failed to resume queue: ${error.message}`);
    }
  }

  /**
   * Get queue status with appointment details (read-only)
   */
  static async getQueueStatus(doctorId: string, date: string): Promise<QueueStatus> {
    try {
      const normalizedDate = normalizeDate(date);
      
      // Find existing queue (read-only, no creation)
      const queue = await Queue.findOne({ doctorId, date: normalizedDate });
      
      // Get appointments for this doctor on this date
      const appointments = await Appointment.find({
        doctorId,
        date: normalizedDate,
        status: { $in: ["booked", "in_session"] }
      }).sort({ queueNumber: 1 });

      return {
        doctorId,
        date: normalizedDate,
        status: queue?.status || "active", // Default to active if no queue exists
        currentAppointments: appointments,
        waitingCount: appointments.filter(app => app.status === "booked").length,
        pausedAt: queue?.pausedAt,
        pauseReason: queue?.pauseReason,
      };
    } catch (error: any) {
      throw new Error(`Failed to get queue status: ${error.message}`);
    }
  }

  /**
   * Check if a doctor can accept new appointments for a date
   */
  static async canAcceptAppointments(doctorId: string, date: string): Promise<boolean> {
    try {
      const normalizedDate = normalizeDate(date);
      const queue = await Queue.findOne({ doctorId, date: normalizedDate });
      
      // If no queue exists, default to accepting appointments
      if (!queue) {
        return true;
      }
      
      return queue.status === "active";
    } catch (error: any) {
      console.error("Error checking queue status:", error);
      return true; // Default to allowing appointments if check fails
    }
  }

  /**
   * Get all queues for a doctor (multiple dates)
   */
  static async getDoctorQueues(doctorId: string): Promise<IQueue[]> {
    try {
      return await Queue.find({ doctorId }).sort({ date: -1 });
    } catch (error: any) {
      throw new Error(`Failed to get doctor queues: ${error.message}`);
    }
  }

  /**
   * Get all active queues (for admin monitoring)
   */
  static async getAllActiveQueues(): Promise<IQueue[]> {
    try {
      // Return all queues regardless of status; frontend can filter by status/date
      return await Queue.find({})
        .populate({
          path: "doctorId",
          select: "name fullName specialization",
          match: { userType: "doctor" }
        })
        .sort({ date: -1 });
    } catch (error: any) {
      throw new Error(`Failed to get active queues: ${error.message}`);
    }
  }

  /**
   * Get queue statistics for admin dashboard
   */
  static async getQueueStats() {
    try {
      // Get today's date in Asia/Colombo timezone
      const now = new Date();
      const todayColombo = normalizeDate(now);
      
      // Also get today in ISO format as fallback
      const todayISO = now.toISOString().split('T')[0];
      
      
      // Get all queues for today - try both date formats
      const [totalQueues, activeQueues, pausedQueues, todayQueuesColombo, todayQueuesISO] = await Promise.all([
        Queue.countDocuments(),
        Queue.countDocuments({ status: "active" }),
        Queue.countDocuments({ status: "paused" }),
        Queue.countDocuments({ date: todayColombo }),
        Queue.countDocuments({ date: todayISO })
      ]);

      // Don't use createdAt - we want queues for today's date, not created today
      // Use the higher count between Colombo and ISO date formats
      const todayQueues = Math.max(todayQueuesColombo, todayQueuesISO);


      return {
        total: totalQueues,
        active: activeQueues,
        paused: pausedQueues,
        today: todayQueues,
      };
    } catch (error: any) {
      throw new Error(`Failed to get queue stats: ${error.message}`);
    }
  }

  /**
   * Get today's queues with more robust date matching
   */
  static async getTodaysQueues() {
    try {
      const now = new Date();
      const todayColombo = normalizeDate(now);
      const todayISO = now.toISOString().split('T')[0];
      
      // Get all queues that match either date format
      const queues = await Queue.find({
        $or: [
          { date: todayColombo },
          { date: todayISO }
        ]
      });
      
      return queues;
    } catch (error: any) {
      throw new Error(`Failed to get today's queues: ${error.message}`);
    }
  }
}
