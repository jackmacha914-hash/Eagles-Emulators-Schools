// models/TransportPayment.js
const mongoose = require('mongoose');

const transportPaymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Bank', 'Mpesa'], default: 'Cash' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransportPayment', transportPaymentSchema);
