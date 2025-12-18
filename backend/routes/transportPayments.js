const express = require("express");
const router = express.Router();
const TransportPayment = require("../models/TransportPayment");

/**
 * CREATE payment
 */
router.post("/", async (req, res) => {
  try {
    const payment = await TransportPayment.create(req.body);
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

