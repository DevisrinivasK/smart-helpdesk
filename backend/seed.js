const mongoose = require('mongoose');
const User = require('./models/User'); // We'll define models next
// ... other models

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  // Insert sample users: admin, agent, user with bcrypt hashed passwords
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('password', 10);
  await User.insertMany([
    { name: 'Admin', email: 'admin@example.com', password_hash: hash, role: 'admin' },
    { name: 'Agent', email: 'agent@example.com', password_hash: hash, role: 'agent' },
    { name: 'User', email: 'user@example.com', password_hash: hash, role: 'user' }
  ]);
  // KB articles from seed example
  await Article.insertMany([ /* array from assignment */ ]);
  // Tickets similarly
  console.log('Seeded!');
  process.exit();
}

seed();