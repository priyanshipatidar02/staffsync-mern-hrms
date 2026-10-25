const router = require('express').Router();
const Training = require('../models/Training');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, isDateStr } = require('../utils/helpers');

router.use(protect);

const shape = (t, userId) => {
  const o = t.toObject();
  o.enrolledCount = o.enrolled.length;
  o.isEnrolled = o.enrolled.some((id) => String(id) === String(userId));
  delete o.enrolled;
  return o;
};

router.get('/', asyncHandler(async (req, res) => {
  const trainings = await Training.find().populate('createdBy', 'name').sort({ startDate: 1 });
  res.json({ trainings: trainings.map((t) => shape(t, req.user._id)) });
}));

router.post('/', authorize('hr', 'manager'), asyncHandler(async (req, res) => {
  const { title, description, mode, startDate, endDate } = req.body;
  if (!isDateStr(startDate) || !isDateStr(endDate)) return res.status(400).json({ message: 'Enter valid start and end dates' });
  if (endDate < startDate) return res.status(400).json({ message: 'End date cannot be before the start date' });
  const training = await Training.create({ title, description, mode, startDate, endDate, createdBy: req.user._id });
  await training.populate('createdBy', 'name');
  res.status(201).json({ training: shape(training, req.user._id) });
}));

// POST /api/trainings/:id/enroll - toggles enrolment for the current user
router.post('/:id/enroll', asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: 'Training not found' });
  const idx = training.enrolled.findIndex((id) => String(id) === String(req.user._id));
  if (idx >= 0) training.enrolled.splice(idx, 1);
  else training.enrolled.push(req.user._id);
  await training.save();
  await training.populate('createdBy', 'name');
  res.json({ training: shape(training, req.user._id) });
}));

router.delete('/:id', authorize('hr', 'manager'), asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: 'Training not found' });
  if (req.user.role !== 'hr' && String(training.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete programs you created' });
  }
  await training.deleteOne();
  res.json({ message: 'Training deleted' });
}));

module.exports = router;
