const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const send = (res, status, user) => {
  const safe = user.toObject();
  delete safe.password;
  res.status(status).json({ token: signToken(user._id), user: safe });
};

// POST /api/auth/register  (the very first account becomes HR admin; everyone after is an employee)
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

  const isFirst = (await User.countDocuments()) === 0;
  const user = await User.create({
    name, email, password,
    department: department || 'General',
    role: isFirst ? 'hr' : 'employee',
    designation: isFirst ? 'HR Administrator' : 'Staff',
  });
  send(res, 201, user);
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password' });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated. Contact HR.' });
  send(res, 200, user);
}));

// GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('manager', 'name email');
  res.json({ user });
}));

// PUT /api/auth/me  (self-service profile update)
router.put('/me', protect, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user });
}));

// PUT /api/auth/password
router.put('/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Enter your current and new password' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
}));

module.exports = router;
