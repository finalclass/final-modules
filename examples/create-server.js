var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('./mime.js');

module.exports = function (port, dir) {

  function getFilePathByRequestUrl(url) {
    var filePath = url;
    if (filePath === '/' || !filePath) {
      filePath = 'index.html';
    }
    return path.join(dir, filePath);
  }

  function onRequest(req, res) {
    var filePath = getFilePathByRequestUrl(req.url);
    if (fs.existsSync(filePath)) {
      res.statusCode = 200;
      res.setHeader('content-type', mime.getContentTypeByFilePath(filePath));
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  }

  http.createServer(onRequest).listen(port);
  console.log('Server running at http://127.0.0.1:/' + port);
};

