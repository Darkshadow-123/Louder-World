const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

require('../config/passport');

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    failureMessage: true
  }),
  async (req, res) => {
    try {
      logger.info('OAuth callback successful, user authenticated:', req.user.email);
      
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      req.user.lastLogin = new Date();
      await req.user.save();

      logger.info(`User logged in: ${req.user.email}`);

      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      logger.error(`Error in OAuth callback: ${error.message}`);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    logger.info('/me called, auth header:', authHeader ? 'present' : 'missing');
    
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    logger.info('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info('Token decoded, user id:', decoded.id);
    
    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn('User not found for id:', decoded.id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    logger.info('User found:', { id: user._id, displayName: user.displayName, email: user.email, role: user.role });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error in /me:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token',
      error: error.message 
    });
  }
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

module.exports = router;
