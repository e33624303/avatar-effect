const express = require('express');
const connect = require('connect');
const fs = require('fs');
const https = require('https');
const http = require('http');

function createHttpsServer() {
  const app = connect().use(express.static(__dirname + '/dist/'));
  const host = '10.102.5.95';
  const port = 443;

  const server = https.createServer(
    {
      key: fs.readFileSync('server.key'),
      cert: fs.readFileSync('server.cert'),
    },
    app
  );
  server.listen(port, host, () => {
    console.log(`Server is running on https://${host}:${port}`);
  });
}
function createHttpServer() {
  const app = connect().use(express.static(__dirname + '/dist/'));
  const host = '127.0.0.1';
  const port = 8000;
  const server = http.createServer(app);
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
}

createHttpServer();
