const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: Number, required: true },
  alternateContactNumber: { type: String, required: true },
  city: { type: String, require: true },
  grNumber: { type: String, required: true },
  barcode: { type: String, unique: true, required: true },
  class: { type: Number, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  note: { type: String },
});

module.exports = mongoose.model("Student", studentSchema);
