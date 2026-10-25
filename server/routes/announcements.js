const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().populate('author', 'name').sort({ createdAt: -1 }).limit(50);
  res.json({ announcements });
}));

router.post('/', authorize('hr'), asyncHandler(async (req, res) => {
  const { title, body, category } = req.body;
  const announcement = await Announcement.create({ title, body, category, author: req.user._id });
  await announcement.populate('author', 'name');
  res.status(201).json({ announcement });
}));

router.delete('/:id', authorize('hr'), asyncHandler(async (req, res) => {
  const found = await Announcement.findByIdAndDelete(req.params.id);
  if (!found) return res.status(404).json({ message: 'Announcement not found' });
  res.json({ message: 'Announcement deleted' });
}));

module.exports = router;
