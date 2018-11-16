var http = require('http');
var fs = require('fs');
var path = require('path');
var rtsp = require('../dist/Index');

var server = http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.end(fs.readFileSync(__dirname + '/index.html', {
        encoding: 'utf-8'
    }));
});
new rtsp.StreamingMediaServer(server);
server.listen(8080);