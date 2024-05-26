const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

app.use('/proxy', createProxyMiddleware({
    target: '', // This will be replaced dynamically
    changeOrigin: true,
    pathRewrite: (path, req) => {
        return path.replace('/proxy?url=', '');
    },
    onProxyReq: (proxyReq, req, res) => {
        const targetUrl = new URL(req.query.url);
        proxyReq.setHeader('host', targetUrl.host);
        proxyReq.setHeader('referer', targetUrl.origin);
        proxyReq.setHeader('origin', targetUrl.origin);
    },
    onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    },
    logLevel: 'debug'
}));

app.listen(3000, () => {
    console.log('Proxy server is running on port 3000');
});

module.exports = app;
