// routes/transportPayments.js
// POST: Create a new payment
const express = require('express');
const router = express.Router();
const TransportPayment = require('../models/TransportPayment');
const TransportFee = require('../models/TransportFee'); // your fee model

router.post('/', async (req, res) => {
    try {
        const { studentId, routeId, amountPaid, term, year, method } = req.body;

        if (!studentId || !routeId || !amountPaid || !term || !year || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 🔹 Get fee for this route
        const feeRecord = await TransportFee.findOne({ routeId });
        if (!feeRecord) {
            return res.status(400).json({ error: 'Transport fee not set for this route' });
        }

        const fee = feeRecord.amount;
        const balance = fee - amountPaid;

        const payment = new TransportPayment({
            studentId,
            routeId,
            fee,
            amountPaid,
            balance,
            term,
            year,
            method
        });

        await payment.save();
        res.status(201).json(payment);

    } catch (err) {
        console.error('Payment save error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

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


module.exports = router;
