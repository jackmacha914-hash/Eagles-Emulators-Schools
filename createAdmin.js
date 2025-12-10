// Load environment variables
require('dotenv').config();

// Dependencies
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import DB connection and User model
const connectDB = require('./backend/config/db');
const User = require('./backend/models/User');

// Admin credentials
const adminEmail = 'admin@admin.com';
const adminPassword = 'qwe123'; // change to your desired password
const adminName = 'Admin';

// Connect to MongoDB
connectDB();

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    console.log(`✅ Admin user created successfully!
Email: ${adminEmail}
Password: ${adminPassword}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
    process.exit(1);
  }
};

createAdmin();
