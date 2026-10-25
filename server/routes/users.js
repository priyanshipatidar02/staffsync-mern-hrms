const router = require('express').Router();
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

router.use(protect);

const EDITABLE = ['name', 'email', 'role', 'department', 'designation', 'phone', 'salary', 'joinDate', 'manager', 'isActive'];

// GET /api/users?search=&department=
// HR: everyone (with salary). Manager: own team (no salary). Employee: basic directory.
router.get('/', asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { designation: rx }];
  }
  if (department) filter.department = department;

  let query;
  if (req.user.role === 'hr') {
    query = User.find(filter).populate('manager', 'name');
  } else if (req.user.role === 'manager') {
    query = User.find({ ...filter, manager: req.user._id }).select('-salary').populate('manager', 'name');
  } else {
    query = User.find({ ...filter, isActive: true }).select('name email department designation role');
  }
  const users = await query.sort({ name: 1 });
  res.json({ users });
}));

// GET /api/users/meta - managers list + departments (for forms/filters)
router.get('/meta', authorize('hr'), asyncHandler(async (req, res) => {
  const managers = await User.find({ role: { $in: ['manager', 'hr'] }, isActive: true }).select('name role');
  const departments = await User.distinct('department');
  res.json({ managers, departments });
}));

// POST /api/users  (HR creates an employee account)
router.post('/', authorize('hr'), asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Set a password for the new employee' });
  const data = { password };
  EDITABLE.forEach((k) => { if (req.body[k] !== undefined && req.body[k] !== '') data[k] = req.body[k]; });
  const user = await User.create(data);
  const safe = user.toObject();
  delete safe.password;
  res.status(201).json({ user: safe });
}));

// PUT /api/users/:id
router.put('/:id', authorize('hr'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Employee not found' });

  if (String(user._id) === String(req.user._id) && (req.body.role !== undefined && req.body.role !== 'hr' || req.body.isActive === false)) {
    return res.status(400).json({ message: 'You cannot demote or deactivate your own account' });
  }
  EDITABLE.forEach((k) => {
    if (req.body[k] !== undefined) user[k] = req.body[k] === '' && k === 'manager' ? null : req.body[k];
  });
  if (req.body.password) user.password = req.body.password;
  await user.save();
  const safe = user.toObject();
  delete safe.password;
  res.json({ user: safe });
}));

// DELETE /api/users/:id
router.delete('/:id', authorize('hr'), asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own account' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Employee not found' });
  await Promise.all([
    Leave.deleteMany({ user: user._id }),
    Attendance.deleteMany({ user: user._id }),
    User.updateMany({ manager: user._id }, { manager: null }),
  ]);
  res.json({ message: 'Employee deleted' });
}));

module.exports = router;
