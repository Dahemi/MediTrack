import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

async function createTestDoctor() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined.");
    }
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("password123", 12);

    const doctor = new User({
      name: "Dr. John Smith",
      email: "doctor@test.com",
      password: hashedPassword,
      userType: "doctor",
      fullName: "Dr. John Smith",
      specialization: "Cardiology",
      yearsOfExperience: 10,
      contactDetails: {
        email: "doctor@test.com",
        phone: "+1234567890",
      },
      profilePictureUrl: "https://ui-avatars.com/api/?name=Dr.+John+Smith",
      availability: [
        {
          day: "Monday",
          date: new Date("2024-01-15"),
          startTime: "09:00",
          endTime: "17:00",
          slots: 10,
        },
      ],
      isVerified: true,
    });

    await doctor.save();
    console.log("Test doctor created successfully!");
    console.log("Email: doctor@test.com");
    console.log("Password: password123");
  } catch (error) {
    console.error("Error creating test doctor:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestDoctor();
