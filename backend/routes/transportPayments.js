const express = require('express');
const router = express.Router();

require('../models/Student');

const TransportPayment = require('../models/TransportPayment');
const TransportFee = require('../models/TransportFee');

// CREATE PAYMENT
router.post('/', async (req, res) => {
    try {
        const {
            studentId,
            routeId,
            amountPaid,
            term,
            year,
            method
        } = req.body;

        if (!studentId || !routeId || !amountPaid || !term || !year || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const feeRecord = await TransportFee.findOne({ routeId });
        if (!feeRecord) {
            return res.status(400).json({ error: 'Transport fee not set for this route' });
        }

        const fee = feeRecord.amount;
        const balance = fee - Number(amountPaid);

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
        res.status(500).json({ error: err.message });
    }
});

// GET PAYMENTS
router.get('/', async (req, res) => {
    try {
        const payments = await TransportPayment.find()
            .populate('studentId', 'name')
            .populate('routeId', 'name');

        res.json(payments);
    } catch (err) {
        console.error('Payment fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
