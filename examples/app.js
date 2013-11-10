// The following code is only necessary to run the example index.html
var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app);

app.configure(function () {
  // Use static file if no controllers were able to respond to the request
  app.use(express.static(__dirname + '/client'));
});

app.post('/', function (req, res) {
  fs.createReadStream('client/index.html').pipe(res);
});

// Start of the relevant parts of the code
var MongoStore = require('../index')
  , Mongo = require('mongodb')
  , io = require('socket.io').listen(server, {
    log: true
  });

io.configure(function () {
  io.set('store', new MongoStore({
    nodeId: null,
    mongo: null,
    host: 'localhost',
    port: 27017,
    mongoClient: null
  }));
});

io.sockets.on('connection', function (socket) {
  console.log('\nConnection to Socket.io initialized !');

  socket.set('a', 'b', function (error) {
    if(error) {
      console.log(error);
    }
    else {
      socket.has('a', function (error, has) {
        if(error) {
          console.log(error);
        }
        else {
          console.log('Has ' + has);
          socket.get('a', function (error, val) {
            if(error) {
              console.log(error);
            }
            else {
              console.log(val);
            }
          });
        }
      });
    }
  });

  socket.emit('request', { message: 'Hello World!' });

  socket.on('response', function (data) {
    console.log('\nResponse from client received !');
    console.log(data);
  });
});

// Make Express.js and Socket.io listen on port 8000
server.listen(8000);
console.log('\nExpress.js and Socket.io listening on port 8000 !');
