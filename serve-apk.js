const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const apkPath = 'D:/Vj 3d Works/VJ-3D-WORKS.apk';

const server = http.createServer((req, res) => {
    if (req.url === '/VJ-3D-WORKS.apk' || req.url === '/download') {
        if (!fs.existsSync(apkPath)) {
            res.writeHead(404);
            return res.end('APK file not found');
        }
        const stat = fs.statSync(apkPath);
        res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Disposition': 'attachment; filename="VJ-3D-WORKS.apk"',
            'Content-Length': stat.size
        });
        const readStream = fs.createReadStream(apkPath);
        readStream.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VJ-3D-WORKS Billing App - Download APK</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        .card { background: #151d30; border: 1px solid #222f49; border-radius: 20px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 12px 36px rgba(0,0,0,0.6); text-align: center; }
        .badge { display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 18px; }
        h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
        p.sub { color: #94a3b8; font-size: 14px; margin: 0 0 24px; line-height: 1.5; }
        .btn { display: block; background: #2563eb; color: #fff; padding: 16px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 17px; transition: 0.2s; box-shadow: 0 4px 16px rgba(37,99,235,0.4); }
        .btn:active { transform: scale(0.98); }
        .guide { margin-top: 24px; text-align: left; background: #0e1526; border-radius: 12px; padding: 16px; border: 1px solid #1f2b45; font-size: 13px; color: #cbd5e1; }
        .guide-title { font-weight: 700; color: #f59e0b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .guide ol { margin: 0; padding-left: 18px; }
        .guide li { margin-bottom: 6px; line-height: 1.4; }
        .guide strong { color: #fff; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">FRESH &amp; CLEAN RELEASE v1.1.0</div>
        <h1>VJ-3D-WORKS</h1>
        <p class="sub">100% Offline Permanent Billing Application<br>Zero Permissions &bull; Mobile: 9159432954</p>
        <a class="btn" href="/VJ-3D-WORKS.apk">⬇️ Download APK (5.3 MB)</a>

        <div class="guide">
            <div class="guide-title">ℹ️ Installation Instructions:</div>
            <ol>
                <li>Tap <strong>Download APK</strong> above. If Chrome prompts "File might be harmful", tap <strong>Download anyway</strong>.</li>
                <li>Open the downloaded file and tap <strong>Install</strong>.</li>
                <li>If Google Play Protect shows "Harmful app blocked", tap the small text link <strong>"Install anyway"</strong> (just above the blue button).</li>
                <li>The app will install immediately and work permanently offline!</li>
            </ol>
        </div>
    </div>
</body>
</html>`);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

