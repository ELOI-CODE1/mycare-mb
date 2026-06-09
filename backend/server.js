const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is working' });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Payment routes
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/test`);
  console.log(`  POST http://localhost:${PORT}/api/payment/request`);
});