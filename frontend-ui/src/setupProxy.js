const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`[setupProxy] Request: ${req.method} ${req.url}`);
    next();
  });

  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend-server:5004',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api' // Don't rewrite the path
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[setupProxy] Proxying ${req.method} ${req.url} to backend-server:5004`);
      },
      onError: (err, req, res) => {
        console.error('[setupProxy] Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ 
          message: 'Proxy error connecting to backend server',
          error: err.message
        }));
      }
    })
  );
  
  // Don't proxy env-config.js, as it's served from the public directory
  app.use(
    '/env-config.js',
    (req, res, next) => {
      console.log('[setupProxy] Handling env-config.js request');
      req.url = '/env-config.js';
      next();
    }
  );
}; 