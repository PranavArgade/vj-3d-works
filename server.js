const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const ROOT_DIR = __dirname;
const APK_PATH = path.join(ROOT_DIR, 'VJ-3D-WORKS.apk');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/manifest+json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.apk': 'application/vnd.android.package-archive',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

function getLocalIps() {
    const interfaces = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
                results.push({ name, ip: iface.address });
            }
        }
    }
    // Prefer Wi-Fi or 192.168.x.x
    results.sort((a, b) => {
        if (a.ip.startsWith('192.168.')) return -1;
        if (b.ip.startsWith('192.168.')) return 1;
        return 0;
    });
    return results;
}

const server = http.createServer((req, res) => {
    let reqUrl = decodeURI(req.url.split('?')[0]);

    // Handle APK downloads
    if (reqUrl === '/VJ-3D-WORKS.apk' || reqUrl === '/download-apk') {
        if (!fs.existsSync(APK_PATH)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('APK file not found');
        }
        const stat = fs.statSync(APK_PATH);
        res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Disposition': 'attachment; filename="VJ-3D-WORKS.apk"',
            'Content-Length': stat.size
        });
        return fs.createReadStream(APK_PATH).pipe(res);
    }

    // Direct routing for download / install page
    if (reqUrl === '/download' || reqUrl === '/install' || reqUrl === '/app' || reqUrl === '/download/') {
        reqUrl = '/download.html';
    }

    // Direct routing for app aliases
    if (reqUrl.toLowerCase() === '/vj-3d-works' || reqUrl.toLowerCase() === '/vj-3d-works.html' || reqUrl.toLowerCase() === '/bill') {
        reqUrl = '/Vj-3D-Works.html';
    }

    // Default to index.html for root
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, reqUrl);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('File not found: ' + reqUrl);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const headers = {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*'
        };

        if (ext === '.html' || ext === '.json' || ext === '.js') {
            headers['Cache-Control'] = 'no-cache';
        } else {
            headers['Cache-Control'] = 'public, max-age=86400';
        }

        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIps();
    console.log(`====================================================`);
    console.log(`🚀 VJ-3D-WORKS Application Server Running!`);
    console.log(`💻 Local PC App:       http://localhost:${PORT}/Vj-3D-Works.html`);
    console.log(`📲 Download & Install: http://localhost:${PORT}/download.html`);
    ips.forEach(item => {
        console.log(`📱 Mobile Web (via ${item.name}): http://${item.ip}:${PORT}/`);
        console.log(`📲 Mobile Install Hub:            http://${item.ip}:${PORT}/download.html`);
    });
    console.log(`🤖 Android APK Direct: http://localhost:${PORT}/VJ-3D-WORKS.apk`);
    console.log(`====================================================`);
});
