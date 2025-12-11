// routes/stats.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Book = require('../models/Book');
const Fee = require('../models/Fee');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    // Count students and teachers
    const studentsCount = await User.countDocuments({ role: 'student' });
    const teachersCount = await User.countDocuments({ role: 'teacher' });

    // Count events
    const eventsCount = await Event.countDocuments();

    // Count clubs
    const clubsCount = await Club.countDocuments();

    // Attendance: Present and Absent
    const presentCount = await Attendance.countDocuments({ status: 'present' });
    const absentCount = await Attendance.countDocuments({ status: 'absent' });

    // Library books issued
    const issuedBooksCount = await Book.countDocuments({ status: 'issued' });

    // Fees: total paid and balance
    const fees = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      }
    ]);

    const totalPaid = fees[0]?.totalPaid || 0;
    const totalBalance = fees[0]?.totalBalance || 0;

    res.status(200).json({
      students: studentsCount,
      teachers: teachersCount,
      events: eventsCount,
      clubs: clubsCount,
      attendance: {
        present: presentCount,
        absent: absentCount
      },
      library: {
        issued: issuedBooksCount
      },
      fees: {
        paid: totalPaid,
        balance: totalBalance
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router;
