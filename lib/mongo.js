
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
Mongo.Client = Client;

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

  var Mongo = opts.mongo || require('mongodb')
    , MongoClient = Mongo.MongoClient
    , Server = Mongo.Server;

  if(opts.Server instanceof Server) {
    this.Server = opts.Server;
  }
  else {
    // create a mongo server with the supplied options
    this.Server = new Server(opts.host, opts.port, {});
  }

  // initialize a new mongo client if none is supplied in the options
  if(opts.mongoClient instanceof MongoClient) {
    this.mongoClient = opts.mongoClient;
  }
  else {
    // create a mongo client with the previously created server
    this.mongoClient = new MongoClient(this.Server, {});
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
        console.log('\nConnection with server initialized !');
        this.db = mongoClient.db('socket-store');
        this.db.createCollection('sessions', function (error, collection) {
          if(error) {
            throw error;
          }
          else {
            console.log('\nCollection "sessions" created with success !');
            this.collection = collection;
            Store.call(that, opts);
          }
        });
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
 * @return {undefined}
 *
 * @api private
 */

Mongo.prototype.publish = function (name) {};

/**
 * Subscribes to a channel
 *
 * @return {undefined}
 *
 * @api private
 */

Mongo.prototype.subscribe = function () {};

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
}

/**
 * Inherits from Store.Client
 */

Client.prototype.__proto__ = Store.Client;

/**
 * `getCallback()` is `get()`'s callback.
 *
 * @callback getCallback
 * @param  {error}
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
  var that = this;
  this.collection.find({
    _id: key
  }, {
   _id: 1
  }).limit(1).exec(function (error, doc) {
    if(error) {
      cb.call(that, error);
    }
    else {
      cb.call(that, null, !!doc);
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
  var that = this;
  this.collection.drop(function (error) {
    if(error) {
      cb.call(that, error);
    }
    else {
      this.db.createCollection(cb);
    }
  });
};
