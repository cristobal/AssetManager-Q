/* global console, window, define, Q */
(function (root, factory) {
  // AMD
  if (typeof define === 'function' && define.amd) {
    define(['Q'], factory, function (Q) {
      root.Loader = factory(Q);
    });
  }
  // Browser globals
  else {
    root.Loader = factory(Q);
  }
}(this, function (Q) {
  "use strict";

  //--------------------------------------------------------------------------
  //
  //  Helper Functions
  //
  //-------------------------------------------------------------------------
  var getClass = {}.toString,
      hasOwnProperty = {}.hasOwnProperty;

  var slice = Array.prototype.slice;
  var nativeBind = Function.prototype.bind;

  function args_to_array(args, index) {
    return slice.call(args, index || 0);
  }

  function bind(fn, c) {
    if (nativeBind &&
        fn.bind === nativeBind) {
      return nativeBind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);
    return function () {
      return fn.apply(c, args.concat(slice.call(arguments)));
    };
  }

  function extend(child, parent) {
    var F = function () {
      this.__construct = function () {
        parent.apply(this, arguments);
      };
      this.constructor = child;
    };
    F.prototype = parent.prototype;

    // append from subclass prototype
    var key;
    for (key in child.prototype) {
      F.prototype[key] = child.prototype[key];
    }

    // append static props from subclass
    for (key in child)  {
      F[key] = child[key];
    }

    child.prototype = new F;
    child.__super__ = parent.prototype;
  }


  //--------------------------------------------------------------------------
  //
  //  Object Functions
  //
  //-------------------------------------------------------------------------
  function is_type(obj, t) {
    return typeof(obj) === t;
  }

  function is_array(obj) {
    if (Array.isArray) {
      return Array.isArray(obj);
    }

    return getClass.call(obj) === "[object Array]";
  }

  function is_object(obj) {
    return !!(obj && is_type(obj, "object"));
  }

  function is_function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  }

  function is_string(obj) {
    return is_type(obj, "string") ||
      getClass.call(obj) === "[object String]";
  }

  function is_undefined(obj) {
    return obj === void 0;
  }

  function obj_has(obj, key) {
    return hasOwnProperty.call(obj, key);
  }

  function obj_each(obj, cb) {
    var c = array_size(args_to_array(arguments)) > 2 ?
            arguments[2] : undefined;
    for (var key in obj) {
      cb.apply(c, [obj[key], key, obj]);
    }
  }


  //--------------------------------------------------------------------------
  //
  //  Array Functions
  //
  //-------------------------------------------------------------------------
  function array_merge() {
    return arguments[0].concat(arguments[0],
      slice.call(arguments, 1));
  }

  function array_size(a) {
    return a.length ? a.length : 0;
  }

  function array_each(a, cb) {
    if (Array.prototype.forEach) {
      return Array.prototype.forEach.apply(a,
        slice.call(arguments, 1));
    }

    var c = array_size(args_to_array(arguments)) > 2 ?
            arguments[2] : undefined;
    for (var i = 0, l = array_size(a); i < l; i++) {
      cb.apply(c, [a[i], i, a]);
    }
  }

  function array_filter(a, cb) {
    if (Array.prototype.filter) {
      return Array.prototype.filter.apply(a,
        slice.call(arguments, 1));
    }

    var c = array_size(args_to_array(arguments)) > 2 ?
            arguments[2] : undefined;
    var s = [];
    for (var i = 0, l = array_size(a); i < l; i++) {
      if (cb.apply(c, [a[i], i, a])) {
        s.push(a[i]);
      }
    }

    return s;
  }

  //--------------------------------------------------------------------------
  //
  //  Helper Utils
  //
  //-------------------------------------------------------------------------
  function generate_asset_id(url) {

  }

  //--------------------------------------------------------------------------
  //
  //  Events Module
  //
  //-------------------------------------------------------------------------
  function Events(types) {
    this._listeners = {};
    array_each(types, function (type) {
      this._listeners[type] = [];
    }, this);
  }

  Events.prototype.on = function (event, listener) {
    if (!obj_has(this._listeners, event)) {
      throw new Error("No such event: `" + event + "` supported");
    }

    if (!is_function(listener)) {
      throw new TypeError("listener is not an function");
    }

    this._listeners[event].push(listener);
    return this;
  };

  Events.prototype.off = function (event, listener) {
    if (!obj_has(this._listeners, event)) {
      throw new Error("No such event: `" + event + "` supported");
    }

    if (!is_undefined(listener) && !is_function(listener)) {
      throw new TypeError("listener is not an function");
    }

    var listeners = this._listeners[event],
        size = array_size(listeners);
    // remove all listeners for given event
    if (is_undefined(listener)) {
      while (size) {
        listeners.pop();
        size--;
      }
    }
    // remove all occurences of current listener
    else {
      for (var i = size; i--;) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
        }
      }
    }

    return this;
  };

  Events.prototype.emit = function (event) {
    if (!obj_has(this._listeners, event)) {
      throw new Error("No such event: `" + event + "` supported");
    }

    var args = args_to_array(arguments, 1);
    array_each(this._listeners[event], function (listener) {
      listener.apply(listener, args);
    });

    return this;
  };


  //--------------------------------------------------------------------------
  //
  //  Loader
  //
  //-------------------------------------------------------------------------
  var LoaderState = {
    PENDING: 0,
    LOADING: 1,
    LOADED:  2,
    ERROR:   3
  };

  //--------------------------------------------------------------------------
  //
  //  ImageLoader
  //
  //-------------------------------------------------------------------------

  function ImageLoader(src) {
    this.__construct(["loading", "loaded", "error"]);
    this.src   = src;
    this.state = LoaderState.PENDING;
  }

  ImageLoader.prototype.setState = function (state) {
    this.state = state;
  };

  ImageLoader.prototype.load = function (defer) {
    if (!this.isPending()) {
      return;
    }
    this.setState(LoaderState.LOADING);
    var deferred =
      defer === false ?
        Q.defer() : undefined;

    this.image = new Image();
    this.image.onload = bind(this._onload, this, deferred);
    this.image.onerror = bind(this._onerror, this, deferred);
    this.image.src = this.src;

    return deferred ?
      deferred.promise : undefined;
  };


  ImageLoader.prototype._onload = function (deferred, load) {
    this.setState(LoaderState.LOADED);
    this.emit("loaded");
    if (deferred) {
      this._deferred.resolve();
    }
  };


  ImageLoader.prototype._onerror = function (deferred, error) {
    this.setState(LoaderState.ERROR);
    this.emit("error", error);
    if (deferred) {
      this._deferred.reject(error);
    }
  };

  ImageLoader.prototype.isPending = function () {
    return this.state === LoaderState.PENDING;
  };

  ImageLoader.prototype.isLoading = function () {
    return this.state === LoaderState.LOADING;
  };

  ImageLoader.prototype.isLoaded = function () {
    return this.state === LoaderState.LOADED;
  };

  ImageLoader.prototype.isError = function () {
    return this.state === LoaderState.ERROR;
  };

  extend(ImageLoader, Events);


  //--------------------------------------------------------------------------
  //
  //  Loader Manager
  //
  //-------------------------------------------------------------------------
  function LoaderBatch(items) {
    this.items = items;
    this.defered = Q.defer();
    this.continueOnError = false;
  }

  LoaderBatch.prototype.pause = function () {

  };

  LoaderBatch.prototype.start = function () {

  };

  //--------------------------------------------------------------------------
  //
  //  Loader Manager
  //
  //-------------------------------------------------------------------------
  function LoaderManager() {
    this.queue = [];
    this.cache = {};
  }

  LoaderManager.prototype.add = function () {

  };

  LoaderManager.prototype.batch = function () {

  };

  LoaderManager.prototype.load = function () {

  };

  LoaderManager.prototype.get = function () {

  };
  extend(LoaderManager, Events);


  // TODO: create id's from url if none provided
  // TODO: load assets other than image supported formats
  //       use XHR2 as in preloadjs?
  // TODO: cache flags for production,
  //       make browser remembers the image for faster loading
  // TODO: configurable option enable sequential loader support for pause/resume


  var RQ = {};

  return RQ;
}));
