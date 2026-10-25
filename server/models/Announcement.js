const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    body: { type: String, required: [true, 'Message is required'], trim: true },
    category: { type: String, enum: ['general', 'policy', 'event', 'urgent'], default: 'general' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
