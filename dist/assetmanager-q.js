(function (root, factory) {
  // AMD
  if (typeof define === 'function' && define.amd) {
    define(['Q'], factory, function (Q) {
      root.AssetManager = factory(Q);
    });
  }
  // Browser globals
  else {
    root.AssetManager = factory(Q);
  }
}(this, function (Q) {
  "use strict";

  //--------------------------------------------------------------------------
  //
  //  Object Functions
  //
  //-------------------------------------------------------------------------
  function args_to_array(args) {
    return Array.prototype.slice.call(args, 0);
  }

  function is_type(a, t) {
    return typeof(a) === t;
  }

  function is_array(a) {
    if (Array.isArray) {
      return Array.isArray(a);
    }

    return Object.prototype.toString.call(a) === '[object Array]';
  }

  function is_object(a) {
    return !!(a && is_type(a, "object"));
  }

  function is_string(a) {
    return is_type(a, "string") ||
      Object.prototype.toString.call(a) === '[object String]';
  }

  function obj_has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }


  //--------------------------------------------------------------------------
  //
  //  Array Functions
  //
  //-------------------------------------------------------------------------
  function array_merge() {
    return arguments[0].concat(arguments[0],
      Array.prototype.slice.call(arguments, 1));
  }

  function array_size(a) {
    return is_array(a) ? a.length : 0;
  }

  function array_each(a, cb) {
    if (Array.prototype.forEach) {
      return Array.prototype.forEach.apply(a,
        Array.prototype.slice.call(arguments, 1));
    }

    var t = array_size(args_to_array(arguments)) > 2 ?
              arguments[2] : undefined;
    for (var i = 0, l = array_size(a); i < l; i++) {
      cb.apply(t, [a[i], i, a]);
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Asset
  //
  //-------------------------------------------------------------------------
  var AssetState = {
    PENDING: 0,
    LOADING: 1,
    LOADED:  2
  };

  function Asset(id, src) {
    this.id    = id;
    this.src   = src;
    this.state = AssetState.PENDING;
  }

  Asset.prototype.setState = function (state) {
    this.state = state;
  };

  Asset.prototype.isLoaded = function () {
    return this.state === AssetState.state;
  };


  //--------------------------------------------------------------------------
  //
  //  Asset Manager
  //
  //-------------------------------------------------------------------------
  // TODO: static methods default Instance method
  // TODO: multiple calls after load has been called?
  // TODO: timeout for images or assets not loaded
  // TODO: load assets other than image supported formats
  //       use XHR2 as in preloadjs?
  // TODO: cache flags for production,
  //       make browser remembers the image for faster loading
  function AssetManager() {
    this._assets = [];
    this._id     = 0;
  }

  /**
   * Add one or more sources to be loaded
   *   A source can either be an url string,
   *   or an object composed of id and src i.e.
   *       {id: "name", src: "url/to/src"}
   */
  AssetManager.prototype.add = function () {
    var args   = args_to_array(arguments),
        asset  = null,
        assets = this._assets;

    array_each(args, function (arg) {
      // is array do recursion
      if (is_array(arg)) {
        this.add.apply(this, arg);
        return;
      }

      // Object test
      else if (is_object(arg) &&
        (!obj_has(arg, 'src') || !AssetManager.supportedFormat(arg.src))) {
        return;
      }
      else if (is_object(arg)) {
        asset = new Asset(
          obj_has(arg, 'id') ? arg.id : this._id++,
          arg.src
        );
      }

      // String
      else if (is_string(arg) && !AssetManager.supportedFormat(arg)) {
        return;
      }
      else if (is_string(arg)) {
        asset = new Asset(this._id++, arg);
      }

      assets.push(asset);
    }, this);

    return this;
  };

  /**
   * Load the assets
   *
   * @returns {Promise}
   */
  AssetManager.prototype.load = function () {
    var assets   = this._assets,
        deferred = Q.defer(),
        image    = null,
        size     = array_size(assets),
        total    = 0;

    if (size > 0) {
      array_each(assets, function (asset) {
        image = new Image();
        image.onload = function () {
          asset.setState(AssetState.LOADED);
          total++;
          if (total === size) {
            deferred.resolve(assets);
          }
        };

        asset.setState(AssetState.LOADING);
        image.src   = asset.src;
      });
    }
    else {
      deferred.resolve(assets);
    }

    return deferred.promise;
  };

  /**
   *
   * @param {string|object}
   * @return {bool} True or false depending on wether the src has been loaded
   *                or not
   */
  AssetManager.prototype.isLoaded = function (arg) {
    var id  = null,
        src = null,
        isObj = is_object(arg),
        isStr = is_string(arg);

    if (!isObj || !isStr) {
      return false;
    }

    if (isObj && (arg instanceof Asset)) {
      return arg.loaded();
    }
    else if (isObj) {
      id  = obj_has(arg, 'id') ? arg.id : null;
      src = obj_has(arg, 'src') ? arg.src : null;
    }
    else if (isStr) {
      src = arg;
    }

    if (!id || !src) {
      return false;
    }

    var assets = this._assets;
    for (var i = 0, l = array_size(assets); i < l; i++) {
      if (assets[i].id === id ||
          assets[i].src === src) {
        return assets[i].loaded();
      }
    }

    return false;
  };

  /**
   * An regular expression to use to check wether the given image format
   * is support or not.
   */
  AssetManager.supportedFormatRe = new RegExp(".+\\.(gif|png|jpg|jpeg)$", "i");

  /**
   * Check wether the source is an support format to load
   *
   * @param {string} The src to check on wether the format is supported
   */
  AssetManager.supportedFormat = function (src) {
    if (!is_string(src)) {
      throw new Error("Supported only accepts strings to test");
    }

    return AssetManager.supportedFormatRe.test(src);
  };

  return AssetManager;
}));
