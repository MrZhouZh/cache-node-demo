const http = require('http');
const fs = require('fs');
const port = 3300;


http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.end();
    console.log(`request url: ${req.url}`);
    if  (req.url === '/') {
        const html = fs.readFileSync('index.html', 'utf-8');

        res.writeHead(200, {
            'Content-Type': 'text/html',
        });

        res.end(html);
    } else if (req.url === '/script.js') {
        res.writeHead(200, {
            'Content-type': 'text/javascript',
            'Vary': req.headers['user-agent'],
            'Cache-Control': 'max-age=10'
        });
        res.end();
    }
}).listen(port);

console.log(`server listening at ${port} port...`);
