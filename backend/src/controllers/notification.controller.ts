import { Request, Response } from "express";
import { Notification } from "../models/notification.model";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ patientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'read',
      readAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notification" });
  }
};