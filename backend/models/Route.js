// models/Route.js
const mongoose = require('mongoose');
const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});
module.exports = mongoose.model('Route', RouteSchema);
