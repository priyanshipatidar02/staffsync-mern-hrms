const router = require('express').Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, businessDays, isDateStr } = require('../utils/helpers');

router.use(protect);

// POST /api/leaves - apply for leave
router.post('/', asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!type || !isDateStr(startDate) || !isDateStr(endDate)) return res.status(400).json({ message: 'Choose a leave type and valid dates' });
  if (endDate < startDate) return res.status(400).json({ message: 'End date cannot be before the start date' });

  const days = businessDays(startDate, endDate);
  if (days < 1) return res.status(400).json({ message: 'That range only covers weekends. Pick working days.' });

  if (type !== 'unpaid' && (req.user.leaveBalance[type] ?? 0) < days) {
    return res.status(400).json({ message: `You only have ${req.user.leaveBalance[type] ?? 0} ${type} day(s) left` });
  }

  const overlap = await Leave.findOne({
    user: req.user._id,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  });
  if (overlap) return res.status(400).json({ message: 'You already have a leave request covering some of these dates' });

  const leave = await Leave.create({ user: req.user._id, type, startDate, endDate, days, reason });
  res.status(201).json({ leave });
}));

// GET /api/leaves/mine
router.get('/mine', asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ user: req.user._id }).populate('reviewedBy', 'name').sort({ createdAt: -1 });
  res.json({ leaves });
}));

// GET /api/leaves/manage?status=pending - leaves the current manager/HR can act on
router.get('/manage', authorize('hr', 'manager'), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === 'manager') {
    const team = await User.find({ manager: req.user._id }).select('_id');
    filter.user = { $in: team.map((u) => u._id) };
  } else {
    filter.user = { $ne: req.user._id }; // HR cannot approve their own requests
  }
  const leaves = await Leave.find(filter)
    .populate('user', 'name department designation')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ leaves });
}));

// PUT /api/leaves/:id/status - approve / reject
router.put('/:id/status', authorize('hr', 'manager'), asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Status must be approved or rejected' });

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: 'Leave request not found' });
  if (leave.status !== 'pending') return res.status(400).json({ message: `This request was already ${leave.status}` });
  if (String(leave.user) === String(req.user._id)) return res.status(403).json({ message: 'You cannot review your own leave request' });

  const applicant = await User.findById(leave.user);
  if (req.user.role === 'manager' && String(applicant.manager) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only review leave for your own team' });
  }

  if (status === 'approved' && leave.type !== 'unpaid') {
    if (applicant.leaveBalance[leave.type] < leave.days) {
      return res.status(400).json({ message: `${applicant.name} no longer has enough ${leave.type} leave balance` });
    }
    applicant.leaveBalance[leave.type] -= leave.days;
    await applicant.save();
  }

  leave.status = status;
  leave.reviewNote = note;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();
  res.json({ leave });
}));

// DELETE /api/leaves/:id - cancel own pending request
router.delete('/:id', asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, user: req.user._id });
  if (!leave) return res.status(404).json({ message: 'Leave request not found' });
  if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled' });
  leave.status = 'cancelled';
  await leave.save();
  res.json({ leave });
}));

module.exports = router;
