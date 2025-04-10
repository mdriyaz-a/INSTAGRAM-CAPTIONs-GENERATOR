const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // No rewrite needed
      },
      headers: {
        Connection: 'keep-alive',
      },
      onProxyRes: function(proxyRes, req, res) {
        // Add CORS headers to the response
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
      onProxyReq: function(proxyReq, req, res) {
        // Log proxy requests for debugging
        console.log('Proxying request:', req.method, req.path);
      },
      onError: function(err, req, res) {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy error: Could not connect to the backend server. Please make sure the backend is running.');
      }
    })
  );
};