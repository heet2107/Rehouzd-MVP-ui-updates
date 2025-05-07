const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple middleware for CORS instead of using the cors package
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from frontend build folder
app.use(express.static(path.join(__dirname, 'frontend-ui/build')));

// Simple API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Basic API proxy without http-proxy-middleware
app.use('/api', (req, res) => {
  res.status(503).json({ 
    message: 'Backend API is not connected in this deployment. Please configure the backend separately.',
    endpoint: req.originalUrl
  });
});

// All remaining requests return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-ui/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});