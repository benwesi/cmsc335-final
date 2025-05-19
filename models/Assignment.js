//used lecture material from Week #14 (May 5)
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  grade: { type: Number, min: 0, max: 100 },
  maxGrade: { type: Number, default: 100 },
  weight: { type: Number, required: true, min: 0, max: 100 },
  dueDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);