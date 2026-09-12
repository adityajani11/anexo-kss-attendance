const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  presentList: [
    {
      barcode: { type: String, required: true },
      timestamp: { type: Date, required: true },
    },
  ],
  absentList: [
    {
      barcode: { type: String, required: true },
      timestamp: { type: Date, required: true },
    },
  ],
});

module.exports = mongoose.model("Attendance", attendanceSchema);
