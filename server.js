const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dns = require('dns');
const { Pool } = require('pg');

// Fix for Node 18+ DNS resolution issues with some shared hosts
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

console.log('--- Hostinger Startup Diagnostics ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);

// Check critical environment variables (presence only)
const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'AWS_S3_BUCKET_NAME'];
criticalVars.forEach(v => {
    console.log(`Checking ${v}:`, process.env[v] ? 'Present ✅' : 'MISSING ❌');
});

async function startServer() {
    try {
        // 1. Test Database Connectivity
        if (process.env.DATABASE_URL) {
            console.log('Attempting to connect to Database...');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                connectionTimeoutMillis: 5000,
                ssl: { rejectUnauthorized: false }
            });

            try {
                const client = await pool.connect();
                console.log('Database Connection: SUCCESS ✅');
                client.release();
                await pool.end();
            } catch (dbError) {
                console.error('Database Connection: FAILED ❌');
                console.error('Error Detail:', dbError.message);
                if (dbError.message.includes('ETIMEDOUT')) {
                    console.error('Hint: Hostinger might be blocking the database port or IPv6 address.');
                }
            }
        } else {
            console.warn('DATABASE_URL is not set. Skipping DB test.');
        }

        // 2. Prepare Next.js
        console.log('Preparing Next.js app...');
        await app.prepare();
        console.log('Next.js Ready ✅');

        // --- 1. Basic Rate Limiting (Simple in-memory) ---
        const RATE_LIMIT_WINDOW = 60000; // 1 minute
        const MAX_REQUESTS_PER_IP = 100;  // 100 requests per minute
        const ipRequests = new Map();

        setInterval(() => ipRequests.clear(), RATE_LIMIT_WINDOW);

        // --- 2. Resource Logging (Every 60s) ---
        setInterval(() => {
            const mem = process.memoryUsage();
            console.log(`[MONITOR] ${new Date().toISOString()} | ` +
                        `Mem: ${Math.round(mem.rss / 1024 / 1024)}MB | ` +
                        `Active Handles: ${process._getActiveHandles().length} | ` +
                        `Active Requests: ${process._getActiveRequests().length}`);
        }, 60000);

        // --- 3. Create Server with Rate Limiting and Health Check ---
        const server = createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            const { pathname } = parsedUrl;

            // Health check
            if (pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
                return;
            }

            // Rate limit check
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const count = (ipRequests.get(ip) || 0) + 1;
            ipRequests.set(ip, count);

            if (count > MAX_REQUESTS_PER_IP) {
                res.writeHead(429, { 'Content-Type': 'text/plain' });
                res.end('Too Many Requests');
                return;
            }

            handle(req, res, parsedUrl);
        });

        // --- 2. Request Timeouts (Prevent hanging connections) ---
        // Shared hosting often has low limits on concurrent processes.
        // We set strict timeouts to free up resources quickly.
        server.timeout = 25000;           // 25s - Close long-running requests
        server.keepAliveTimeout = 5000;   // 5s  - Shorter keep-alive to free sockets
        server.headersTimeout = 6000;      // 6s  - Time for headers to arrive

        server.listen(port, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://localhost:${port}`);
        });

        // --- 3. Graceful Shutdown ---
        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });

            // Force exit after 10s if server doesn't close
            setTimeout(() => {
                console.error('Could not close connections in time, forceful shutdown');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (err) {
        console.error('FATAL ERROR DURING STARTUP:');
        console.error(err);
        process.exit(1);
    }
}

startServer();
