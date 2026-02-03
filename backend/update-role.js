const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

const updateUserRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'rishi.123.lalwani@gmail.com' });
    
    if (user) {
      console.log('User found:', user.email, 'Current role:', user.role);
      user.role = 'admin';
      await user.save();
      console.log('User role updated to admin');
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateUserRole();
