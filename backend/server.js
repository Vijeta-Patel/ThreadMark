const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CSV_FILE = path.join(__dirname, '../database/garments.csv');

// Create CSV with headers if it doesn't exist
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Brand Name,Material,Size,Color,Price,Timestamp\n');
}

// Basic CSV escaping function
const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

const server = http.createServer((req, res) => {
    // Handle API request to save data
    if (req.method === 'POST' && req.url === '/api/garments') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const timestamp = new Date().toISOString();
                
                // Format as a CSV row
                const csvRow = `${escapeCSV(data.brand_name)},${escapeCSV(data.material)},${escapeCSV(data.size)},${escapeCSV(data.color)},${escapeCSV(data.price)},${escapeCSV(timestamp)}\n`;
                
                // Append to CSV file
                fs.appendFileSync(CSV_FILE, csvRow);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Garment saved to CSV' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid data' }));
            }
        });
        return;
    }

    // Serve frontend files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    let absolutePath = path.join(__dirname, '../frontend', filePath);

    const extname = String(path.extname(absolutePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(absolutePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Server is running!`);
    console.log(`👉 Open your browser to: http://localhost:${PORT}`);
    console.log(`📁 Data will be saved to: database/garments.csv`);
    console.log(`=========================================\n`);
});
