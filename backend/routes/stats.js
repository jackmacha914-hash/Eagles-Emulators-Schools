const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const studentsCount = await User.countDocuments({ role: 'student' });
        const teachersCount = await User.countDocuments({ role: 'teacher' });
        const eventsCount = await Event.countDocuments();
        const clubsCount = await Club.countDocuments();

        const attendanceTotal = await Attendance.countDocuments();
        const attendancePresent = await Attendance.countDocuments({ status: 'present' });
        const attendanceAbsent = await Attendance.countDocuments({ status: 'absent' });

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
            clubs: clubsCount,
            attendance: {
                total: attendanceTotal,
                present: attendancePresent,
                absent: attendanceAbsent
            },
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
