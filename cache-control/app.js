const http = require('http');
const fs = require('fs');
const port = 3300;

http.createServer((request, response) => {
    console.log(`request url ${request.url}`);
    if (request.url === '/') {
        const html = fs.readFileSync('cache-control.html', 'utf-8');
        response.writeHead(200, {
            'Content-type': 'text-html'
        });

        response.end(html);
    } else if (request.url === '/script.js') {
        response.writeHead(200, {
            'Content-type': 'text/script',
            'Cache-Control': 'max-age=200',
        });

        response.end('console.log(\'script load\')');
    }
}).listen(port);

console.log(`server Listening at ${port} port...`);
