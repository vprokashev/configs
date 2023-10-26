const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', req.url);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.statusCode = 404;
            res.end('File not found');
            return;
        }
        fs.createReadStream(filePath).pipe(res);
    });
});

const PORT = process.env.PORT || 2024;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
