// Run with: npm run seed   (wipes the database and loads demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');
const { dateStr } = require('./utils/helpers');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync');
  await Promise.all([User, Leave, Attendance, Announcement, Training].map((m) => m.deleteMany({})));

  const PW = 'Password@123';
  const hr = await User.create({ name: 'Priya Sharma', email: 'hr@staffsync.com', password: PW, role: 'hr', department: 'Human Resources', designation: 'HR Director', phone: '9800000001', salary: 120000 });
  const mgr = await User.create({ name: 'Rohan Verma', email: 'manager@staffsync.com', password: PW, role: 'manager', department: 'Engineering', designation: 'Engineering Manager', phone: '9800000002', salary: 140000, manager: hr._id });
  const team = await User.create([
    { name: 'Aisha Khan', email: 'aisha@staffsync.com', password: PW, department: 'Engineering', designation: 'Frontend Developer', phone: '9800000003', salary: 70000, manager: mgr._id },
    { name: 'Vikram Rao', email: 'vikram@staffsync.com', password: PW, department: 'Engineering', designation: 'Backend Developer', phone: '9800000004', salary: 75000, manager: mgr._id },
    { name: 'Neha Joshi', email: 'employee@staffsync.com', password: PW, department: 'Engineering', designation: 'QA Engineer', phone: '9800000005', salary: 62000, manager: mgr._id },
  ]);

  // a week of attendance history for everyone
  const everyone = [hr, mgr, ...team];
  const rows = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if ([0, 6].includes(d.getDay())) continue;
    for (const u of everyone) {
      const inT = new Date(d); inT.setHours(9, Math.floor(Math.random() * 50), 0, 0);
      const outT = new Date(d); outT.setHours(17, 30 + Math.floor(Math.random() * 40), 0, 0);
      rows.push({ user: u._id, date: dateStr(d), checkIn: inT, checkOut: outT, hours: Math.round(((outT - inT) / 36e5) * 100) / 100, status: inT.getMinutes() > 30 ? 'late' : 'present' });
    }
  }
  await Attendance.insertMany(rows);

  const next = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };
  await Leave.create([
    { user: team[0]._id, type: 'annual', startDate: next(7), endDate: next(9), days: 3, reason: 'Family wedding' },
    { user: team[1]._id, type: 'sick', startDate: next(2), endDate: next(2), days: 1, reason: 'Dental appointment' },
  ]);

  await Announcement.create([
    { title: 'Welcome to StaffSync', body: 'Mark attendance, apply for leave and read company news right here. Reach out to HR if anything looks off.', category: 'general', author: hr._id },
    { title: 'Diwali holiday schedule', body: 'The office will be closed on the main festival day and the day after. Plan your handovers before the break.', category: 'event', author: hr._id },
    { title: 'Updated remote work policy', body: 'Employees may work remotely up to two days a week with manager approval. The full policy is on the HR drive.', category: 'policy', author: hr._id },
  ]);

  await Training.create([
    { title: 'Secure coding essentials', description: 'OWASP top 10, JWT handling and safe database queries.', mode: 'online', startDate: next(5), endDate: next(6), createdBy: mgr._id, enrolled: [team[0]._id] },
    { title: 'Leading effective 1:1s', description: 'A workshop for people managers on feedback and career conversations.', mode: 'in-person', startDate: next(12), endDate: next(12), createdBy: hr._id },
  ]);

  console.log('Seeded. Log in with any of these (password: Password@123):');
  console.log('  HR       hr@staffsync.com');
  console.log('  Manager  manager@staffsync.com');
  console.log('  Employee employee@staffsync.com');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
