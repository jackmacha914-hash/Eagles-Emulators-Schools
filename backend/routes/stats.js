// routes/stats.js
const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Library = require('../models/Library');
const Club = require('../models/Club');
const Fee = require('../models/Fee');

const router = express.Router();

// Get stats for dashboard
router.get('/', async (req, res) => {
    try {
        // Students and teachers
        const studentsCount = await User.countDocuments({ role: 'student' });
        const teachersCount = await User.countDocuments({ role: 'teacher' });

        // Events
        const eventsCount = await Event.countDocuments();

        // Attendance
        const attendanceTotal = await Attendance.countDocuments();
        const attendancePresent = await Attendance.countDocuments({ status: 'present' });
        const attendanceAbsent = await Attendance.countDocuments({ status: 'absent' });

        // Library
        const libraryIssued = await Library.countDocuments({ status: 'issued' });

        // Clubs
        const clubsActive = await Club.countDocuments({ isActive: true });

        // Fees
        const feesPaidAgg = await Fee.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const feesBalanceAgg = await Fee.aggregate([
            { $match: { status: 'balance' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            students: studentsCount,
            teachers: teachersCount,
            events: eventsCount,
            attendance: {
                total: attendanceTotal,
                present: attendancePresent,
                absent: attendanceAbsent
            },
            library: {
                issued: libraryIssued
            },
            clubs: clubsActive,
            fees: {
                paid: feesPaidAgg[0]?.total || 0,
                balance: feesBalanceAgg[0]?.total || 0
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

module.exports = router;
