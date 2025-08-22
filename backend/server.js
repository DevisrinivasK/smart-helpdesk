require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const auth = require('./middleware/auth');
app.get('/test-protected', auth(['admin']), (req, res) => res.json({ msg: 'Protected route' }));

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/kb', require('./routes/kb'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/healthz', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send('Backend root is working!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));