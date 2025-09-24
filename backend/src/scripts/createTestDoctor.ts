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

    // Get current date and create availability for next 14 days (including today)
    const today = new Date();
    const availability = [];

    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip weekends for this example
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        availability.push({
          day: dayNames[date.getDay()] as string,
          date: date.toISOString(),
          startTime: "09:00",
          endTime: "17:00",
          slots: 16, // 8 hours * 2 slots per hour (30 min slots)
        });
      }
    }

    const doctorEmail = "doctor@test.com";

    // Check if doctor already exists
    const existingDoctor = await User.findOne({
      email: doctorEmail,
      userType: "doctor",
    });

    if (existingDoctor) {
      // Update existing doctor with new availability
      existingDoctor.availability = availability;
      existingDoctor.isVerified = true;
      await existingDoctor.save();

      console.log("Existing test doctor updated successfully!");
      console.log("Email: doctor@test.com");
      console.log("Password: password123");
      console.log(
        `Updated availability for ${availability.length} days:`,
        availability.map((a) => `${a.day} (${a.date.split("T")[0]})`)
      );
    } else {
      // Create new doctor
      const doctor = new User({
        name: "Dr. John Smith",
        email: doctorEmail,
        password: hashedPassword,
        userType: "doctor",
        fullName: "Dr. John Smith",
        specialization: "Cardiology",
        yearsOfExperience: 10,
        contactDetails: {
          email: doctorEmail,
          phone: "+1234567890",
        },
        profilePictureUrl: "https://ui-avatars.com/api/?name=Dr.+John+Smith",
        availability: availability,
        isVerified: true,
      });

      await doctor.save();
      console.log("New test doctor created successfully!");
      console.log("Email: doctor@test.com");
      console.log("Password: password123");
      console.log(
        `Created availability for ${availability.length} days:`,
        availability.map((a) => `${a.day} (${a.date.split("T")[0]})`)
      );
    }

    // Create additional test doctors for variety
    const additionalDoctors = [
      {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@test.com",
        fullName: "Dr. Sarah Johnson",
        specialization: "Dermatology",
        yearsOfExperience: 8,
      },
      {
        name: "Dr. Michael Chen",
        email: "michael.chen@test.com",
        fullName: "Dr. Michael Chen",
        specialization: "Pediatrics",
        yearsOfExperience: 12,
      },
      {
        name: "Dr. Emily Wilson",
        email: "emily.wilson@test.com",
        fullName: "Dr. Emily Wilson",
        specialization: "Orthopedics",
        yearsOfExperience: 15,
      },
    ];

    for (const doctorData of additionalDoctors) {
      const existingDoc = await User.findOne({
        email: doctorData.email,
        userType: "doctor",
      });

      if (!existingDoc) {
        const newDoctor = new User({
          ...doctorData,
          password: hashedPassword,
          userType: "doctor",
          contactDetails: {
            email: doctorData.email,
            phone: "+1234567890",
          },
          profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            doctorData.fullName
          )}`,
          availability: availability,
          isVerified: true,
        });

        await newDoctor.save();
        console.log(`Created additional doctor: ${doctorData.fullName}`);
      } else {
        // Update availability for existing additional doctors
        existingDoc.availability = availability;
        await existingDoc.save();
        console.log(`Updated availability for: ${doctorData.fullName}`);
      }
    }
  } catch (error) {
    console.error("Error creating test doctor:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestDoctor();
