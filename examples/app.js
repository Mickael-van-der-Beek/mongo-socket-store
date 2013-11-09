var MongoStore = require('../index')
  , Mongo = require('mongodb')
  , io = require('socket.io').listen(8000, {
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
