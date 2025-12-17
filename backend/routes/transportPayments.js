// routes/transportPayments.js
const express = require('express');
const router = express.Router();
const TransportPayment = require('../models/TransportPayment');

// POST: Create a new payment
router.post('/', async (req, res) => {
    try {
        const { studentId, routeId, amount, paymentMethod } = req.body;
        if (!studentId || !routeId || !amount) return res.status(400).json({ error: 'Missing required fields' });

        const payment = new TransportPayment({ studentId, routeId, amount, paymentMethod });
        await payment.save();

        res.status(201).json({ message: 'Payment recorded', payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: List all payments
router.get('/', async (req, res) => {
    try {
        const payments = await TransportPayment.find()
            .populate('studentId', 'name')
            .populate('routeId', 'name');
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
