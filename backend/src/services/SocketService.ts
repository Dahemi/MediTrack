import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export interface QueueUpdatePayload {
  doctorId: string;
  date: string;
  status: "active" | "paused";
  pauseReason?: string;
  timestamp: Date;
}

export interface AppointmentUpdatePayload {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  action: "rescheduled" | "cancelled" | "updated";
  newDate?: string;
  newTime?: string;
  reason?: string;
  timestamp: Date;
  date?: string; // Add date field for queue room broadcasting
}

export class SocketService {
  private static io: SocketIOServer | null = null;
  private static connectedClients = new Map<string, { 
    userId: string; 
    userType: "patient" | "doctor" | "admin";
    rooms: string[];
  }>();

  /**
   * Initialize Socket.io server
   */
  static init(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:3000",
          process.env.FRONTEND_URL || "http://localhost:5173",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    return this.io;
  }

  /**
   * Setup socket event handlers
   */
  private static setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {

      // Handle user authentication/identification
      socket.on("authenticate", (data: { 
        userId: string; 
        userType: "patient" | "doctor" | "admin" 
      }) => {
        
        this.connectedClients.set(socket.id, {
          userId: data.userId,
          userType: data.userType,
          rooms: [],
        });

        // Join appropriate rooms based on user type
        if (data.userType === "doctor") {
          const doctorRoom = `doctor_${data.userId}`;
          socket.join(doctorRoom);
          this.connectedClients.get(socket.id)?.rooms.push(doctorRoom);
        } else if (data.userType === "admin") {
          socket.join("admin_room");
          this.connectedClients.get(socket.id)?.rooms.push("admin_room");
        }

        socket.emit("authenticated", { success: true });
      });

      // Handle joining doctor queue room (for patients)
      socket.on("join_doctor_queue", (data: { doctorId: string; date: string }) => {
        const queueRoom = `queue_${data.doctorId}_${data.date}`;
        socket.join(queueRoom);
        
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.push(queueRoom);
        }
        
      });

      // Handle leaving queue room
      socket.on("leave_doctor_queue", (data: { doctorId: string; date: string }) => {
        const queueRoom = `queue_${data.doctorId}_${data.date}`;
        socket.leave(queueRoom);
        
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms = client.rooms.filter(room => room !== queueRoom);
        }
        
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        this.connectedClients.delete(socket.id);
      });
    });
  }

  /**
   * Broadcast queue status update to all relevant clients
   */
  static broadcastQueueUpdate(payload: QueueUpdatePayload): void {
    if (!this.io) {
      console.warn("Socket.io not initialized");
      return;
    }

    const queueRoom = `queue_${payload.doctorId}_${payload.date}`;
    const doctorRoom = `doctor_${payload.doctorId}`;

    // Notify patients in the queue
    this.io.to(queueRoom).emit("queue_status_updated", {
      doctorId: payload.doctorId,
      date: payload.date,
      status: payload.status,
      message: payload.status === "paused" 
        ? `Queue paused by doctor${payload.pauseReason ? `: ${payload.pauseReason}` : ""}`
        : "Queue resumed by doctor",
      timestamp: payload.timestamp,
    });

    // Notify the doctor
    this.io.to(doctorRoom).emit("queue_status_updated", payload);

    // Notify admin
    this.io.to("admin_room").emit("queue_status_updated", {
      ...payload,
      adminNotification: true,
    });

  }

  /**
   * Broadcast appointment update to relevant clients
   */
  static broadcastAppointmentUpdate(payload: AppointmentUpdatePayload): void {
    if (!this.io) {
      console.warn("Socket.io not initialized");
      return;
    }

    const doctorRoom = `doctor_${payload.doctorId}`;
    const patientRoom = `patient_${payload.patientId}`;

    // Notify the doctor
    this.io.to(doctorRoom).emit("appointment_updated", payload);

    // Notify the patient
    this.io.to(patientRoom).emit("appointment_updated", {
      ...payload,
      message: this.getAppointmentUpdateMessage(payload),
    });

    // Notify admin
    this.io.to("admin_room").emit("appointment_updated", {
      ...payload,
      adminNotification: true,
    });

    // Notify all patients monitoring this doctor's queue
    // Use the date from payload if available, otherwise use today's date
    const queueDate = payload.date || new Date().toISOString().split('T')[0];
    const queueRoom = `queue_${payload.doctorId}_${queueDate}`;
    
    this.io.to(queueRoom).emit("appointment_updated", {
      ...payload,
      message: this.getAppointmentUpdateMessage(payload),
    });

  }

  /**
   * Send notification to specific user
   */
  static sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn("Socket.io not initialized");
      return;
    }

    // Find all sockets for this user
    const userSockets = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => client.userId === userId)
      .map(([socketId, _]) => socketId);

    userSockets.forEach(socketId => {
      this.io?.to(socketId).emit(event, data);
    });
  }

  /**
   * Get connected clients count
   */
  static getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients by type
   */
  static getClientsByType(userType: "patient" | "doctor" | "admin"): number {
    return Array.from(this.connectedClients.values())
      .filter(client => client.userType === userType).length;
  }

  /**
   * Helper to format appointment update messages
   */
  private static getAppointmentUpdateMessage(payload: AppointmentUpdatePayload): string {
    switch (payload.action) {
      case "rescheduled":
        return `Your appointment has been rescheduled to ${payload.newDate} at ${payload.newTime}${payload.reason ? `. Reason: ${payload.reason}` : ""}`;
      case "cancelled":
        return `Your appointment has been cancelled by the doctor${payload.reason ? `. Reason: ${payload.reason}` : ""}`;
      case "updated":
        return "Your appointment has been updated";
      default:
        return "Your appointment has been modified";
    }
  }

  /**
   * Get Socket.io instance
   */
  static getIO(): SocketIOServer | null {
    return this.io;
  }
}
