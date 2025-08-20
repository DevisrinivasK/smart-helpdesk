require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Article = require('./models/Article');
const Ticket = require('./models/Ticket');
const Config = require('./models/Config');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear existing data (optional, for re-seeding)
  await User.deleteMany({});
  await Article.deleteMany({});
  await Ticket.deleteMany({});
  await Config.deleteMany({});

  // Seed Users
  const hash = await bcrypt.hash('password', 10); // Same pw for all, change in prod
  await User.insertMany([
    { name: 'Admin', email: 'admin@example.com', password_hash: hash, role: 'admin' },
    { name: 'Agent', email: 'agent@example.com', password_hash: hash, role: 'agent' },
    { name: 'User', email: 'user@example.com', password_hash: hash, role: 'user' }
  ]);
  console.log('Users seeded');

  // Seed KB Articles (from assignment example)
  await Article.insertMany([
    { title: 'How to update payment method', body: 'Go to settings > billing > update card.', tags: ['billing', 'payments'], status: 'published' },
    { title: 'Troubleshooting 500 errors', body: 'Check logs, restart app.', tags: ['tech', 'errors'], status: 'published' },
    { title: 'Tracking your shipment', body: 'Use order ID on tracking page.', tags: ['shipping', 'delivery'], status: 'published' }
  ]);
  console.log('KB articles seeded');

  // Seed Tickets (from assignment example, category 'other' initially)
  await Ticket.insertMany([
    { title: 'Refund for double charge', description: 'I was charged twice for order #1234', category: 'other' },
    { title: 'App shows 500 on login', description: 'Stack trace mentions auth module', category: 'other' },
    { title: 'Where is my package?', description: 'Shipment delayed 5 days', category: 'other' }
  ]);
  console.log('Tickets seeded');

  // Seed Config
  await Config.create({});
  console.log('Config seeded');

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch(err => console.error('Seeding error:', err));