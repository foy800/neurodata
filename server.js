const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.php': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.php';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Handle PHP files
    if (extname === '.php') {
        exec(`php -f "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>PHP Error</h1><pre>${error.message}</pre>`);
                return;
            }
            if (stderr) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>PHP Error</h1><pre>${stderr}</pre>`);
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(stdout);
        });
        return;
    }

    // Handle static files
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Sorry, check with the site admin for error: ${error.code} ..
`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔧 PHP files will be processed automatically`);
    console.log(`💡 Press Ctrl+C to stop the server`);
});