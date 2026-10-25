const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, dateStr, isDateStr } = require('../utils/helpers');

router.use(protect);

const LATE_AFTER_HOUR = 9;
const LATE_AFTER_MIN = 30;

// POST /api/attendance/check-in
router.post('/check-in', asyncHandler(async (req, res) => {
  const now = new Date();
  const date = dateStr(now);
  if (await Attendance.findOne({ user: req.user._id, date })) {
    return res.status(400).json({ message: 'You have already checked in today' });
  }
  const late = now.getHours() > LATE_AFTER_HOUR || (now.getHours() === LATE_AFTER_HOUR && now.getMinutes() > LATE_AFTER_MIN);
  const record = await Attendance.create({ user: req.user._id, date, checkIn: now, status: late ? 'late' : 'present' });
  res.status(201).json({ record });
}));

// POST /api/attendance/check-out
router.post('/check-out', asyncHandler(async (req, res) => {
  const now = new Date();
  const record = await Attendance.findOne({ user: req.user._id, date: dateStr(now) });
  if (!record) return res.status(400).json({ message: 'Check in first' });
  if (record.checkOut) return res.status(400).json({ message: 'You have already checked out today' });
  record.checkOut = now;
  record.hours = Math.round(((now - record.checkIn) / 36e5) * 100) / 100;
  await record.save();
  res.json({ record });
}));

// GET /api/attendance/mine?month=YYYY-MM
router.get('/mine', asyncHandler(async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : dateStr().slice(0, 7);
  const records = await Attendance.find({ user: req.user._id, date: new RegExp(`^${month}`) }).sort({ date: -1 });
  res.json({ month, records });
}));

// GET /api/attendance/team?date=YYYY-MM-DD - HR sees everyone, managers see their team
router.get('/team', authorize('hr', 'manager'), asyncHandler(async (req, res) => {
  const date = isDateStr(req.query.date) ? req.query.date : dateStr();
  const userFilter = req.user.role === 'hr' ? { isActive: true } : { manager: req.user._id, isActive: true };
  const users = await User.find(userFilter).select('name department designation').sort({ name: 1 });
  const ids = users.map((u) => u._id);

  const [records, leaves] = await Promise.all([
    Attendance.find({ date, user: { $in: ids } }),
    Leave.find({ user: { $in: ids }, status: 'approved', startDate: { $lte: new Date(date) }, endDate: { $gte: new Date(date) } }),
  ]);
  const recMap = Object.fromEntries(records.map((r) => [String(r.user), r]));
  const leaveSet = new Set(leaves.map((l) => String(l.user)));

  const rows = users.map((u) => {
    const r = recMap[String(u._id)];
    return {
      user: u,
      checkIn: r?.checkIn || null,
      checkOut: r?.checkOut || null,
      hours: r?.hours || 0,
      status: r ? r.status : leaveSet.has(String(u._id)) ? 'on leave' : 'absent',
    };
  });
  res.json({ date, rows });
}));

module.exports = router;
