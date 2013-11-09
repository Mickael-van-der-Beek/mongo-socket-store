
/*!
 * mongo-socket-store
 * Copyright(c) 2013 Mickael van der Beek <mickael@sagacify.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Store = require('../examples/node_modules/socket.io/lib/store')
  , crypto = require('crypto')
  , utils = require('./utils')
  , isObject = utils.isObject;

/**
 * Exports the constructor.
 */

module.exports = Mongo;

/**
 * Mongo store.
 *
 * @param  {object}   [opts] - Options
 * @param  {function} [opts.mongo] - Mongo constructor, defaults to mongodb
 * @param  {function} [opts.mongoClient] - Instance of MongoClient, connected or not
 * @param  {function} [opts.mongoServer] - Instance of MongoServer
 *
 * @return {undefined}
 *
 * @api public
 */

function Mongo (opts) {

  opts = isObject(opts) ? opts : {};

  this.nodeId = nodeId();

  var Mongo = opts.mongo || require('mongodb')
    , MongoClient = Mongo.MongoClient
    , Server = Mongo.Server;

  if(opts.Server instanceof Server) {
    this.Server = opts.Server;
  }
  else {
    // create a mongo server with the supplied options
    this.Server = new Server(opts.host, opts.port, {
      readPreference: null,
      ssl: false,
      sslValidate: false,
      sslCA: null,
      sslCert: null,
      sslKey: null,
      sslPass: null,
      poolSize: 5,
      socketOptions: {
        noDelay: true,
        keepAlive: 0,
        connectTimeoutMS: null,
        socketTimeoutMS: null
      },
      logger: null,
      auto_reconnect: false,
      disableDriverBSONSizeCheck: false
    });
  }

  // initialize a new mongo client if none is supplied in the options
  if(opts.mongoClient instanceof MongoClient) {
    this.mongoClient = opts.mongoclient;
  }
  else {
    // create a mongo client with the previously created server
    this.mongoClient = new MongoClient(this.Server, {
      w: 1,
      wtimeout: 0,
      fsync: false,
      journal: false,
      native_parser: false,
      forceServerObjectId: false,
      serializeFunctions: false,
      raw: false,
      recordQueryStats: false,
      retryMiliSeconds: 5000,
      numberOfRetries: 5
    });
  }

  if(this.mongoClient._db && this.mongoClient._db.serverConfig.connected) {
    Store.call(this, opts);
  }
  else {
  var that = this;
    this.mongoClient.open(function (error, mongoClient) {
      if(error) {
        throw error;
      }
      else {
        Store.call(that, opts);
      }
    });
  }

}

/**
 * Inherits from Store.
 */

Mongo.prototype.__proto__ = Store.prototype;

/**
 * Publishes a message.
 *
 * @param {string} name - XXXX
 *
 * @return {undefined}
 *
 * @api private
 */

Mongo.prototype.publish = function (name) {};

/**
 * `subscribeCallback` is `subscribe`'s callback.
 *
 * @callback subscribeCallback
 */

/**
 * Subscribes to a channel
 *
 * @param  {string}            name - XXXX
 * @param  {function}          consumer - XXXX
 * @param  {subscribeCallback} cb - Callback called when the subscription is done
 *
 * @return {undefined}
 *
 * @api private
 */

Mongo.prototype.subscribe = function (name, consumer, cb) {};

/**
 * Inherits from Store.
 */

Mongo.prototype.__proto__ = Store.prototype;

/**
 * Publishes a message.
 *
 * @api private
 */

Mongo.prototype.publish = function () { };

/**
 * Subscribes to a channel
 *
 * @api private
 */

Mongo.prototype.subscribe = function () { };

/**
 * Unsubscribes
 *
 * @api private
 */

Mongo.prototype.unsubscribe = function () { };

/**
 * Client constructor
 *
 * @api private
 */

function Client () {
  Store.Client.apply(this, arguments);
  this.data = {};
};

/**
 * Inherits from Store.Client
 */

Client.prototype.__proto__ = Store.Client;

/**
 * `getCallback()` is `get()`'s callback.
 *
 * @callback getCallback
 */

/**
 * Gets a key
 *
 * @param  {string}      key - Key that will be getted
 * @param  {getCallback} cb  - Callback called when the get action is done
 *
 * @return {undefined}
 *
 * @api public
 */

Client.prototype.get = function (key, cb) {
  var that = this;
  this.collection.find({
    _id: key
  }, {
    value: 1,
    _id  : 0
  }).limit(1).exec(function (error, doc) {
    if(error) {
      cb.call(that, error);
    }
    else {
      cb.call(that, null, doc.value || null);
    }
  });
};

/**
 * `setCallback()` is `set()`'s callback.
 *
 * @callback setCallback
 */

/**
 * Sets a key
 *
 * @param  {string}      key   - Key to which the value will be assigned
 * @param  {*}           value - Value that will be setted
 * @param  {setCallback} cb    - Callback called when the set action is done
 *
 * @return {undefined}
 *
 * @api public
 */

Client.prototype.set = function (key, value, cb) {
  var that = this;
  this.collection.update({
    _id: key
  }, {
    $set: {
      value: value
    }
  }, {
    upsert: true
  }, function (error) {
    cb.call(that, error);
  });
};

/**
 * `hasCallback()` is `has()`'s callback.
 *
 * @callback hasCallback
 */

/**
 * Has a key
 *
 * @param  {string}      key - Key of which the presence will be checked 
 * @param  {hasCallback} cb  - Callback called when the has action is done
 *
 * @return {undefined}
 *
 * @api public
 */

Client.prototype.has = function (key, cb) {
  this.collection.find({
    _id: key
  }, {
   _id: 1
  }).limit(1).exec(function (error, doc) {
    if(error) {
      cb.call(error);
    }
    else {
      cb.call(null, !!doc);
    }
  });
};

/**
 * `delCallback()` is `del()`'s callback.
 *
 * @callback delCallback
 */

/**
 * Deletes a key
 *
 * @param  {string}      key - Key of which the value will be deleted 
 * @param  {delCallback} cb  - Callback called when the del action is done
 *
 * @return {undefined}
 *
 * @api public
 */

Client.prototype.del = function (key, cb) {
  this.db.remove(key, cb);
};

/**
 * `destroyCallback()` is `destroy()`'s callback.
 *
 * @callback destroyCallback
 */

/**
 * Destroys the clients data. Alias for a collection's drop.
 *
 * @param  {destroyCallback} cb  - Callback called when the destroy action is done
 *
 * @return {undefined}
 *
 * @api private
 */

Client.prototype.destroy = function (cb) {
  this.collection.drop(function (error) {
    if(error) {
      cb.call(this, error);
    }
    else {
      this.db.createCollection(cb);
    }
  });
};


