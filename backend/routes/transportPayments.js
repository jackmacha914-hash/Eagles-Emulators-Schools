// routes/transportPayments.js
const express = require('express');
const router = express.Router();
const TransportPayment = require('../models/TransportPayment');
const TransportFee = require('../models/TransportFee'); // make sure this exists

// POST: Create a new payment
router.post('/', async (req, res) => {
    try {
        const { studentId, routeId, amount, paymentMethod, term, year } = req.body;
        if (!studentId || !routeId || !amount || !paymentMethod || !term || !year)
            return res.status(400).json({ error: 'Missing required fields' });

        // Get the route fee
        const feeDoc = await TransportFee.findOne({ routeId });
        const fee = feeDoc ? feeDoc.amount : 0;

        const balance = fee - amount;

        const payment = new TransportPayment({
            studentId,
            routeId,
            fee,
            amountPaid: amount,
            balance,
            paymentMethod,
            term,
            year,
            createdAt: new Date()
        });

        await payment.save();
        res.status(201).json({ message: 'Payment recorded', payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: List all payments (optionally filtered by term/year)
router.get('/', async (req, res) => {
    try {
        const { term, year } = req.query;
        const filter = {};
        if (term) filter.term = term;
        if (year) filter.year = Number(year);

        const payments = await TransportPayment.find(filter)
            .populate('studentId', 'name')
            .populate('routeId', 'name');
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
