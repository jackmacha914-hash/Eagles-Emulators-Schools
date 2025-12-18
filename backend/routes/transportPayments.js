const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TransportPayment = require("../models/TransportPayment");
const Route = require("../models/Route"); // Make sure your Route model has a `fee` field

/**
 * CREATE payment
 */
router.post("/", async (req, res) => {
  try {
    const { studentId, routeId, amount, term, year, method } = req.body;

    // 1️⃣ Get the fee for the route
    const route = await Route.findById(routeId);
    const routeFee = route?.fee || 0;

    // 2️⃣ Sum previous payments for this student, route, term, year
    const previousPayments = await TransportPayment.aggregate([
      { $match: { 
          studentId: mongoose.Types.ObjectId(studentId), 
          routeId: mongoose.Types.ObjectId(routeId), 
          term, 
          year 
      }},
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
    ]);
    const totalPaidBefore = previousPayments[0]?.totalPaid || 0;

    // 3️⃣ Calculate balance and status
    const balance = routeFee - (totalPaidBefore + amount);
    const status = balance <= 0 ? "Paid" : (balance < routeFee ? "Partial" : "Unpaid");

    // 4️⃣ Save the payment with balance and status
    const payment = await TransportPayment.create({
      studentId,
      routeId,
      amount,
      term,
      year,
      method,
      balance,
      status
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET payments (with filters)
 */
router.get("/", async (req, res) => {
  try {
    const { term, year } = req.query;

    const filter = {};
    if (term) filter.term = term;
    if (year) filter.year = year;

    const payments = await TransportPayment
      .find(filter)
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE payment
 */
router.delete("/:id", async (req, res) => {
  await TransportPayment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
