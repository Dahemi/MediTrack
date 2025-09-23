import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/admin.model.js";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/meditrack";

// Admin accounts to create
const adminAccounts = [
  {
    username: "admin",
    password: "admin123",
    email: "admin@meditrack.com",
    fullName: "System Administrator",
  },
  {
    username: "superadmin",
    password: "super123",
    email: "superadmin@meditrack.com",
    fullName: "Super Administrator",
  },
];

async function createAdminAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    for (const adminData of adminAccounts) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
          $or: [
            { username: adminData.username },
            { email: adminData.email },
          ],
        });

        if (existingAdmin) {
          console.log(`⚠️  Admin with username '${adminData.username}' or email '${adminData.email}' already exists`);
          continue;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

        // Create admin
        const admin = new Admin({
          username: adminData.username,
          password: hashedPassword,
          email: adminData.email,
          fullName: adminData.fullName,
          role: "admin",
          isActive: true,
        });

        await admin.save();
        console.log(`✅ Created admin account: ${adminData.username} (${adminData.email})`);
        console.log(`   Password: ${adminData.password}`);
        console.log(`   Full Name: ${adminData.fullName}`);
        console.log("");
      } catch (error: any) {
        console.error(`❌ Error creating admin '${adminData.username}':`, error.message);
      }
    }

    console.log("🎉 Admin account creation completed!");
    console.log("");
    console.log("📝 IMPORTANT NOTES:");
    console.log("1. Change default passwords after first login");
    console.log("2. Store credentials securely");
    console.log("3. These accounts have full admin privileges");
    console.log("");
    console.log("🚀 You can now start the server and login at /admin/login");

  } catch (error: any) {
    console.error("❌ Error connecting to database:", error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("📕 Database connection closed");
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: any) => {
  console.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

// Run the script
console.log("🔧 Creating admin accounts...");
createAdminAccounts();
