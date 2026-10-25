const router = require('express').Router();
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');
const { protect } = require('../middleware/auth');
const { asyncHandler, dateStr } = require('../utils/helpers');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const me = req.user;
  const today = dateStr();
  const todayDate = new Date(today);

  const [todayRecord, pendingMine, announcements] = await Promise.all([
    Attendance.findOne({ user: me._id, date: today }),
    Leave.countDocuments({ user: me._id, status: 'pending' }),
    Announcement.find().populate('author', 'name').sort({ createdAt: -1 }).limit(3),
  ]);

  let stats = {};
  if (me.role === 'hr') {
    const [totalEmployees, presentToday, onLeaveToday, pendingApprovals, departments] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: today }),
      Leave.countDocuments({ status: 'approved', startDate: { $lte: todayDate }, endDate: { $gte: todayDate } }),
      Leave.countDocuments({ status: 'pending', user: { $ne: me._id } }),
      User.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    stats = { totalEmployees, presentToday, onLeaveToday, pendingApprovals, departments };
  } else if (me.role === 'manager') {
    const team = await User.find({ manager: me._id, isActive: true }).select('_id');
    const ids = team.map((u) => u._id);
    const [presentToday, pendingApprovals] = await Promise.all([
      Attendance.countDocuments({ date: today, user: { $in: ids } }),
      Leave.countDocuments({ status: 'pending', user: { $in: ids } }),
    ]);
    stats = { teamSize: ids.length, presentToday, pendingApprovals };
  } else {
    const month = today.slice(0, 7);
    const [daysPresent, upcomingTrainings] = await Promise.all([
      Attendance.countDocuments({ user: me._id, date: new RegExp(`^${month}`) }),
      Training.countDocuments({ enrolled: me._id, endDate: { $gte: todayDate } }),
    ]);
    stats = { daysPresent, upcomingTrainings };
  }

  res.json({ today: todayRecord, leaveBalance: me.leaveBalance, pendingMine, announcements, stats });
}));

module.exports = router;
