const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Serve static files from frontend build folder
app.use(express.static(path.join(__dirname, 'frontend-ui/build')));

// Proxy API requests to backend
// Assuming your backend is running on port 5004 internally
app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:5004',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
}));

// Start backend server (alternative approach)
// Optional if using proxy above. Uncomment if needed.
/*
const { exec } = require('child_process');
const backendProcess = exec('cd backend-server && npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Backend error: ${error}`);
    return;
  }
  console.log(`Backend stdout: ${stdout}`);
  console.error(`Backend stderr: ${stderr}`);
});
*/

// All remaining requests return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-ui/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});