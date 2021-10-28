const http = require('http');
const fs = require('fs');
const path = require('path');
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
        const filepath = path.join(__dirname, req.url);
        const stat = fs.statSync(filepath);
        const mtime = stat.mtime.toGMTString();
        const reqMtime = req.headers['if-modified-since'];

        console.log(stat);
        console.log(`mtime: ${mtime}, reqMtime: ${reqMtime}`);

        if (mtime === reqMtime) {
            res.statusCode = 304;
            res.end();
            return;
        }

        console.log('协商缓存 Last-Modified 失效');
        res.writeHead(200, {
            'Content-type': 'text/javascript',
            'Last-Modified': mtime,
            'Cache-Control': 'max-age=0',
        });

        const readStream = fs.createReadStream(filepath);
        readStream.pipe(res);
    }
}).listen(port);

console.log(`server listening at ${port} port...`);
