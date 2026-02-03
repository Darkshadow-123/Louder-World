const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth profile received:', { 
          id: profile.id, 
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value 
        });
        
        const id = profile.id;
        const displayName = profile.displayName || profile.name?.givenName || '';
        const emails = profile.emails || [];
        const email = emails[0]?.value;
        const photos = profile.photos || [];
        
        if (!email) {
          logger.error('No email in Google profile');
          return done(new Error('No email provided by Google'), null);
        }
        
        const fallbackName = email.split('@')[0];

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = id;
            await user.save();
          }
          return done(null, user);
        }

        user = await User.create({
          googleId: id,
          displayName: displayName || fallbackName,
          email,
          photo: photos[0]?.value,
          lastLogin: new Date()
        });

        done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
