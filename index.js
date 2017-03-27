const express = require('express');
let app = express();

let http = require('http').Server(app);
let io = require('socket.io')(http);

const require_location = '/lib/require.js';
const gl_matrix_location = '/lib/gl-matrix.js';
const socketio_location = '/socket.io/socket.io.js';
const main_module = 'main';
const base_url_location = '/lib';
const main_css_location = '/css/main.css';

const ENV = process.env.NODE_ENV || 'DEVELOPMENT';
const PORT = process.env.PORT || 8080;

const index_template = `
  <!doctype html>
  <html>
    <head>
      <link rel="stylesheet" type="text/css" href="${main_css_location}" />
      <script type="text/javascript">
        var requirejs = {
          baseUrl: '${base_url_location}',
          shim: {
            'socket.io': {
              exports: 'io'
            }
          },
          paths: {
            'socket.io': '${socketio_location}'
          }
        };
      </script>
      <script type="text/javascript" src="${require_location}" data-main="${main_module}"></script>
    </head>
    <body data-environment="${ENV}"/>
  </html>
`;

io.on('connection', function(socket) {
  console.log('connection');
});

app.use(`${require_location}`, express.static(`${__dirname}/node_modules/requirejs/require.js`));
app.use(`${gl_matrix_location}`, express.static(`${__dirname}/node_modules/gl-matrix/dist/gl-matrix.js`));
app.use(express.static(`${__dirname}/public`));
app.get('/', function(req, res) {
  res.send(index_template);
});

http.listen(PORT, function() {
  console.log('app listening on port', PORT);
});
