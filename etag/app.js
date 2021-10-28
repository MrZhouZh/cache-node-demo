const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const port = 3300;

const md5 = buffer => crypto.createHash('md5').update(buffer).digest('hex');

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
        const buffer = fs.readFileSync(filepath);
        const fileMd5 = md5(buffer);
        console.log(req.headers);
        console.log(`fileMd5: ${fileMd5}`);
        const noneMatch = req.headers['if-none-match'];
        console.log(`noneMatch: ${noneMatch}`);

        if (noneMatch === fileMd5) {
            res.statusCode = 304;
            res.end();
            return;
        }

        console.log('ETag 缓存失效');
        res.writeHead(200, {
            'Content-type': 'text/javascript',
            'Cache-Control': 'max-age=0',
            'ETag': fileMd5,
        });

        const readStream = fs.createReadStream(filepath);
        readStream.pipe(res);
    }
}).listen(port);

console.log(`server listening at ${port} port...`);
