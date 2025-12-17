const mongoose = require('mongoose');

const transportPaymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
    fee: { type: Number, required: true },      // The expected fee for this route
    amountPaid: { type: Number, required: true },
    balance: { type: Number, default: 0 },      // Fee - amountPaid
    method: { type: String, enum: ['Cash', 'Mpesa', 'Bank Transfer'], required: true },
    term: { type: String, enum: ['Term 1', 'Term 2', 'Term 3'], required: true },
    year: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransportPayment', transportPaymentSchema);
