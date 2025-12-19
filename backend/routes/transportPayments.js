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

    if (!studentId || !routeId || !amount || !term || !year || !method) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(routeId)
    ) {
      return res.status(400).json({ error: "Invalid student or route ID" });
    }

    const route = await Route.findById(routeId);
    const routeFee = route?.fee || 0;

    const previousPayments = await TransportPayment.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          routeId: new mongoose.Types.ObjectId(routeId),
          term,
          year
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" }
        }
      }
    ]);

    const totalPaidBefore = previousPayments.length > 0
      ? previousPayments[0].totalPaid
      : 0;

    const balance = routeFee - (totalPaidBefore + amount);
    const status =
      balance <= 0 ? "Paid" :
      totalPaidBefore > 0 ? "Partial" : "Unpaid";

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
    console.error("PAYMENT ERROR:", err);
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
