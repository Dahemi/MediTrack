import { Appointment } from "../models/appointment.model.js";

export interface QueueSession {
  doctorId: string;
  date: string;
  status: 'active' | 'paused' | 'stopped';
  currentQueueNumber?: number;
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  stoppedAt?: Date;
}

export interface QueueRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    patientAge?: { min?: number; max?: number };
    appointmentType?: string[];
    isUrgent?: boolean;
    isVip?: boolean;
  };
  action: 'move_to_front' | 'move_to_back' | 'skip' | 'priority_boost';
}

export interface QueueReorderRequest {
  appointmentId: string;
  newPosition: number;
  reason?: string;
}

// In-memory storage for queue sessions (in production, this could be Redis)
const queueSessions = new Map<string, QueueSession>();

// Default queue rules
const defaultQueueRules: QueueRule[] = [
  {
    id: 'urgent_priority',
    name: 'Urgent Cases Priority',
    description: 'Move urgent cases to front of queue',
    priority: 1,
    conditions: { isUrgent: true },
    action: 'move_to_front'
  },
  {
    id: 'vip_priority',
    name: 'VIP Patient Priority',
    description: 'Give VIP patients priority in queue',
    priority: 2,
    conditions: { isVip: true },
    action: 'priority_boost'
  },
  {
    id: 'elderly_priority',
    name: 'Elderly Patient Priority',
    description: 'Prioritize patients over 65 years old',
    priority: 3,
    conditions: { patientAge: { min: 65 } },
    action: 'priority_boost'
  }
];

export class QueueService {
  // Start queue for a doctor on a specific date
  static async startQueue(doctorId: string, date: string): Promise<QueueSession> {
    const sessionKey = `${doctorId}-${date}`;
    
    // Check if queue already exists
    if (queueSessions.has(sessionKey)) {
      const existingSession = queueSessions.get(sessionKey)!;
      if (existingSession.status === 'active') {
        throw new Error('Queue is already active');
      }
    }

    // Update all appointments to "waiting" status
    await Appointment.updateMany(
      { doctorId, date, status: { $in: ["booked"] } },
      { status: "waiting" }
    );

    const session: QueueSession = {
      doctorId,
      date,
      status: 'active',
      startedAt: new Date(),
    };

    queueSessions.set(sessionKey, session);
    return session;
  }

  // Pause queue
  static async pauseQueue(doctorId: string, date: string): Promise<QueueSession> {
    const sessionKey = `${doctorId}-${date}`;
    const session = queueSessions.get(sessionKey);

    if (!session) {
      throw new Error('Queue session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Queue is not active');
    }

    session.status = 'paused';
    session.pausedAt = new Date();

    queueSessions.set(sessionKey, session);
    return session;
  }

  // Resume queue
  static async resumeQueue(doctorId: string, date: string): Promise<QueueSession> {
    const sessionKey = `${doctorId}-${date}`;
    const session = queueSessions.get(sessionKey);

    if (!session) {
      throw new Error('Queue session not found');
    }

    if (session.status !== 'paused') {
      throw new Error('Queue is not paused');
    }

    session.status = 'active';
    session.resumedAt = new Date();

    queueSessions.set(sessionKey, session);
    return session;
  }

  // Stop queue
  static async stopQueue(doctorId: string, date: string): Promise<QueueSession> {
    const sessionKey = `${doctorId}-${date}`;
    const session = queueSessions.get(sessionKey);

    if (!session) {
      throw new Error('Queue session not found');
    }

    // Update all waiting appointments back to "booked"
    await Appointment.updateMany(
      { doctorId, date, status: { $in: ["waiting", "called"] } },
      { status: "booked" }
    );

    session.status = 'stopped';
    session.stoppedAt = new Date();

    queueSessions.set(sessionKey, session);
    return session;
  }

  // Get queue session
  static getQueueSession(doctorId: string, date: string): QueueSession | null {
    const sessionKey = `${doctorId}-${date}`;
    return queueSessions.get(sessionKey) || null;
  }

  // Get queue statistics
  static async getQueueStats(doctorId: string, date: string) {
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ["waiting", "called", "in_session", "completed"] }
    }).sort({ queueNumber: 1 });

    const stats = {
      total: appointments.length,
      waiting: appointments.filter(a => a.status === "waiting").length,
      called: appointments.filter(a => a.status === "called").length,
      inSession: appointments.filter(a => a.status === "in_session").length,
      completed: appointments.filter(a => a.status === "completed").length,
      currentQueueNumber: appointments.find(a => a.status === "called" || a.status === "in_session")?.queueNumber || null,
      nextQueueNumber: appointments.find(a => a.status === "waiting")?.queueNumber || null,
    };

    return stats;
  }

  // Get current patient being served
  static async getCurrentPatient(doctorId: string, date: string) {
    return await Appointment.findOne({
      doctorId,
      date,
      status: { $in: ["called", "in_session"] }
    }).sort({ queueNumber: 1 });
  }

  // Get next patients in queue
  static async getNextPatients(doctorId: string, date: string, limit: number = 5) {
    return await Appointment.find({
      doctorId,
      date,
      status: "waiting"
    })
    .sort({ queueNumber: 1 })
    .limit(limit);
  }

  // Calculate estimated wait time
  static async getEstimatedWaitTime(doctorId: string, date: string, queueNumber: number): Promise<number> {
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ["waiting", "called", "in_session"] },
      queueNumber: { $lt: queueNumber }
    }).sort({ queueNumber: 1 });

    // Average consultation time (in minutes) - this could be configurable
    const averageConsultationTime = 15;
    
    return appointments.length * averageConsultationTime;
  }

  // Advanced Queue Management Methods

  // Reorder queue positions
  static async reorderQueue(doctorId: string, date: string, reorderRequests: QueueReorderRequest[]): Promise<boolean> {
    try {
      const appointments = await Appointment.find({
        doctorId,
        date,
        status: { $in: ["waiting", "called"] }
      }).sort({ queueNumber: 1 });

      // Create a map of appointment IDs to their current positions
      const appointmentMap = new Map();
      appointments.forEach((app, index) => {
        appointmentMap.set(app._id.toString(), index);
      });

      // Validate reorder requests
      for (const request of reorderRequests) {
        if (!appointmentMap.has(request.appointmentId)) {
          throw new Error(`Appointment ${request.appointmentId} not found in queue`);
        }
        if (request.newPosition < 0 || request.newPosition >= appointments.length) {
          throw new Error(`Invalid position ${request.newPosition} for appointment ${request.appointmentId}`);
        }
      }

      // Create new queue order
      const newOrder = [...appointments];
      
      // Apply reorder requests
      for (const request of reorderRequests) {
        const currentIndex = appointmentMap.get(request.appointmentId);
        const appointment = newOrder[currentIndex];
        
        // Remove from current position
        newOrder.splice(currentIndex, 1);
        
        // Insert at new position
        newOrder.splice(request.newPosition, 0, appointment);
      }

      // Update queue numbers
      for (let i = 0; i < newOrder.length; i++) {
        await Appointment.findByIdAndUpdate(newOrder[i]._id, { queueNumber: i + 1 });
      }

      return true;
    } catch (error) {
      console.error('Error reordering queue:', error);
      return false;
    }
  }

  // Apply queue rules to reorder appointments
  static async applyQueueRules(doctorId: string, date: string, rules: QueueRule[] = defaultQueueRules): Promise<boolean> {
    try {
      const appointments = await Appointment.find({
        doctorId,
        date,
        status: { $in: ["waiting"] }
      }).sort({ queueNumber: 1 });

      if (appointments.length === 0) return true;

      // Sort rules by priority
      const sortedRules = rules.sort((a, b) => a.priority - b.priority);

      // Apply rules to reorder appointments
      let reorderedAppointments = [...appointments];

      for (const rule of sortedRules) {
        reorderedAppointments = await this.applyRule(reorderedAppointments, rule);
      }

      // Update queue numbers
      for (let i = 0; i < reorderedAppointments.length; i++) {
        await Appointment.findByIdAndUpdate(reorderedAppointments[i]._id, { queueNumber: i + 1 });
      }

      return true;
    } catch (error) {
      console.error('Error applying queue rules:', error);
      return false;
    }
  }

  // Apply a single rule to appointments
  private static async applyRule(appointments: any[], rule: QueueRule): Promise<any[]> {
    const matchingAppointments = appointments.filter(app => this.matchesRule(app, rule));
    const nonMatchingAppointments = appointments.filter(app => !this.matchesRule(app, rule));

    switch (rule.action) {
      case 'move_to_front':
        return [...matchingAppointments, ...nonMatchingAppointments];
      case 'move_to_back':
        return [...nonMatchingAppointments, ...matchingAppointments];
      case 'priority_boost':
        // Move matching appointments up by 2 positions
        const result = [...nonMatchingAppointments];
        matchingAppointments.forEach((app, index) => {
          const insertIndex = Math.min(index * 2, result.length);
          result.splice(insertIndex, 0, app);
        });
        return result;
      default:
        return appointments;
    }
  }

  // Check if appointment matches rule conditions
  private static matchesRule(appointment: any, rule: QueueRule): boolean {
    const conditions = rule.conditions;

    // Check urgent condition
    if (conditions.isUrgent !== undefined) {
      // This would need to be added to the appointment model or derived from notes
      const isUrgent = appointment.notes?.toLowerCase().includes('urgent') || false;
      if (conditions.isUrgent !== isUrgent) return false;
    }

    // Check VIP condition
    if (conditions.isVip !== undefined) {
      // This would need to be added to the appointment model
      const isVip = appointment.notes?.toLowerCase().includes('vip') || false;
      if (conditions.isVip !== isVip) return false;
    }

    // Check age condition (would need patient age in appointment model)
    if (conditions.patientAge) {
      // For now, we'll skip age-based rules as we don't have patient age in the model
      // In a real implementation, you'd need to join with patient data
    }

    return true;
  }

  // Add walk-in patient to queue
  static async addWalkInPatient(doctorId: string, date: string, patientData: any): Promise<any> {
    try {
      // Find the last queue number for this doctor on this date
      const lastAppointment = await Appointment.findOne({ doctorId, date }).sort({ queueNumber: -1 });
      const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1;

      // Create walk-in appointment
      const walkInAppointment = await Appointment.create({
        ...patientData,
        doctorId,
        date,
        queueNumber,
        status: "waiting",
        notes: (patientData.notes || '') + ' [WALK-IN]'
      });

      return walkInAppointment;
    } catch (error) {
      console.error('Error adding walk-in patient:', error);
      throw error;
    }
  }

  // Skip patient in queue
  static async skipPatient(appointmentId: string, reason?: string): Promise<boolean> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return false;

      // Move to end of queue
      const lastAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: appointment.date
      }).sort({ queueNumber: -1 });

      const newQueueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : appointment.queueNumber;

      await Appointment.findByIdAndUpdate(appointmentId, {
        queueNumber: newQueueNumber,
        status: "waiting",
        notes: (appointment.notes || '') + ` [SKIPPED: ${reason || 'No reason provided'}]`
      });

      return true;
    } catch (error) {
      console.error('Error skipping patient:', error);
      return false;
    }
  }

  // Get queue analytics
  static async getQueueAnalytics(doctorId: string, date: string) {
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ["waiting", "called", "in_session", "completed", "cancelled"] }
    }).sort({ queueNumber: 1 });

    const analytics = {
      totalAppointments: appointments.length,
      completed: appointments.filter(a => a.status === "completed").length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      averageWaitTime: 0, // Would need to calculate based on actual times
      longestWaitTime: 0, // Would need to calculate based on actual times
      walkIns: appointments.filter(a => a.notes?.includes('[WALK-IN]')).length,
      skipped: appointments.filter(a => a.notes?.includes('[SKIPPED]')).length,
      urgent: appointments.filter(a => a.notes?.toLowerCase().includes('urgent')).length,
      vip: appointments.filter(a => a.notes?.toLowerCase().includes('vip')).length
    };

    return analytics;
  }
}
