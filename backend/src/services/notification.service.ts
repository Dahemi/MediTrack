import { Appointment } from "../models/appointment.model";
import { sendAppointmentNotification } from "../config/mailer";

export const checkAndNotifyPatients = async (doctorId: string, currentAppointmentId: string) => {
  try {
    // Get current appointment
    const currentAppointment = await Appointment.findById(currentAppointmentId);
    if (!currentAppointment) return;

    // Find next 2 appointments in queue
    const upcomingAppointments = await Appointment.find({
      doctorId,
      date: currentAppointment.date,
      status: 'booked',
      notificationSent: false,
      queueNumber: {
        $gt: currentAppointment.queueNumber,
        $lte: currentAppointment.queueNumber + 2
      }
    }).populate('patientId', 'email name');

    // Send notifications
    for (const appointment of upcomingAppointments) {
      // Calculate estimated wait time (45 seconds per appointment for testing)
      const waitingAppointments = appointment.queueNumber - currentAppointment.queueNumber;
      const estimatedWaitTime = waitingAppointments * 45;

      // Send email notification
      await sendAppointmentNotification(
        appointment.patientId.email,
        appointment.patientId.name,
        appointment.doctorName,
        appointment.queueNumber,
        currentAppointment.queueNumber,
        estimatedWaitTime
      );

      // Mark notification as sent
      appointment.notificationSent = true;
      await appointment.save();
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};