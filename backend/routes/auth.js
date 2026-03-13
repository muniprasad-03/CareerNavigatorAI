const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'CAREER_NAVIGATOR_V1_PRODUCTION_SECRET';

  // ---------------------------------------------------------------------------
  // SHOWCASE BYPASS: Allow any registration in production/demo
  // ---------------------------------------------------------------------------
  if (process.env.VERCEL || process.env.AI_DEMO_MODE === 'true') {
     console.log("SHOWCASE BYPASS: Auto-registering user", email);
     // Deterministic 24-character hex ID from email
     const crypto = require('crypto');
     const hash = crypto.createHash('md5').update(email || 'guest').digest('hex').substring(0, 24);
     const payload = { user: { id: hash } }; 
     return jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: hash, name: name || 'Showcase User', email } });
     });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name, email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'CAREER_NAVIGATOR_V1_PRODUCTION_SECRET';

  // ---------------------------------------------------------------------------
  // SHOWCASE BYPASS: Allow any login in production/demo
  // ---------------------------------------------------------------------------
  if (process.env.VERCEL || process.env.AI_DEMO_MODE === 'true') {
     console.log("SHOWCASE BYPASS: Auto-logging in user", email);
     const crypto = require('crypto');
     const hash = crypto.createHash('md5').update(email || 'guest').digest('hex').substring(0, 24);
     const payload = { user: { id: hash } }; 
     return jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: hash, name: 'Showcase User', email } });
     });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
