/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/*
	 * Restify v0.3.1
	 * (c) 2013 Ilan Frumer
	 * License: MIT
	*/

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	angular.module('restify', []);

	var original = {};

	angular.module('restify').config(['$httpProvider', function ($httpProvider) {
	  original.transformRequest = $httpProvider.defaults.transformRequest[0];
	  original.transformResponse = $httpProvider.defaults.transformResponse[0];
	}]);

	angular.module('restify').factory('restify', ['$http', '$q', function ($http, $q) {

	  //# helpers

	  var uriToArray = function uriToArray(uri) {
	    return _.filter(uri.split('/'), function (a) {
	      return a;
	    });
	  };

	  //# wrap response data with resified objects


	  var restify = function restify(data, wrap) {
	    var _this = this;

	    var newElement = null;

	    if (_.isObject(data)) {
	      (function () {

	        var $id = null;
	        var $route = _this.$$route;

	        for (var key in _this.$$route) {
	          var val = _this.$$route[key];
	          if (/^:/.test(key)) {
	            $id = key.match(/^:(.+)/)[1];
	            $route = val;
	            break;
	          }
	        }

	        if (_.isArray(data)) {
	          var _newElement;

	          newElement = new Restify(_this.$$url, _this.$$route, _this.$$parent);

	          if ($id) {

	            data = _.map(data, function (item) {

	              if (item[$id]) {
	                return _.extend(new Restify(newElement.$$url + '/' + item[$id], $route, newElement), item);
	              } else {
	                return item;
	              }
	            });
	          }

	          (_newElement = newElement).push.apply(_newElement, _toConsumableArray(data));
	        } else {

	          if ($id && data[$id]) {
	            newElement = new Restify(_this.$$url + '/' + data[$id], _this.$$route, _this);
	          } else {
	            newElement = new Restify(_this.$$url, _this.$$route, _this.$$parent);
	          }

	          newElement = _.extend(newElement, data);
	        }
	      })();
	    } else {
	      newElement = new Restify(this.$$url, this.$$route, this.$$parent);
	      newElement.data = data;
	    }

	    return newElement;
	  };

	  //# unwrap request data from resified objects

	  var deRestify = function deRestify(obj) {
	    if (angular.isObject(obj)) {
	      return _.omit(obj, function (v, k) {
	        return (/^\$/.test(k)
	        );
	      });
	    }
	  };

	  //# class

	  var Restify = function () {
	    function Restify(base, route, parent) {
	      var _this2 = this;

	      _classCallCheck(this, Restify);

	      this.$$url = base;
	      this.$$route = route;
	      this.$$parent = parent;
	      this.$$config = {};
	      this.push = Array.prototype.push;

	      var _loop = function _loop(key) {
	        var val = route[key];
	        if (base === '/') {
	          base = '';
	        }
	        if (/^:/.test(key)) {
	          var $id = key.match(/^:(.+)/)[1];
	          _this2['$' + $id] = function (id) {
	            return new Restify(base + '/' + id, val, this);
	          };
	        } else {
	          _this2['$' + key] = new Restify(base + '/' + key, val, _this2);
	        }
	      };

	      for (var key in route) {
	        _loop(key);
	      }
	    }

	    _createClass(Restify, [{
	      key: '$req',
	      value: function $req(config, wrap) {
	        var _this3 = this;

	        if (wrap == null) {
	          wrap = true;
	        }
	        var conf = {};
	        if (config.data) {
	          config.data = deRestify(config.data);
	        }
	        config.url = this.$$url;

	        angular.extend(conf, this.$$config, config);

	        // defaults
	        conf.method = conf.method || 'GET';
	        if (_.isEmpty(conf.params)) {
	          delete conf.params;
	        }

	        return $http(conf).then(function (response) {
	          if (wrap) {
	            response.data = restify.call(_this3, response.data);
	          }
	          return response.data;
	        });
	      }
	    }, {
	      key: '$ureq',
	      value: function $ureq(config) {
	        return this.$req(config, false);
	      }
	    }, {
	      key: '$uget',
	      value: function $uget(params) {
	        if (params === null) {
	          params = {};
	        }return this.$ureq({ method: 'GET', params: params });
	      }
	    }, {
	      key: '$get',
	      value: function $get(params) {
	        if (params === null) {
	          params = {};
	        }return this.$req({ method: 'GET', params: params });
	      }
	    }, {
	      key: '$upost',
	      value: function $upost(data) {
	        return this.$ureq({ method: 'POST', data: data || this });
	      }
	    }, {
	      key: '$post',
	      value: function $post(data) {
	        return this.$req({ method: 'POST', data: data || this });
	      }
	    }, {
	      key: '$uput',
	      value: function $uput(data) {
	        return this.$ureq({ method: 'PUT', data: data || this });
	      }
	    }, {
	      key: '$put',
	      value: function $put(data) {
	        return this.$req({ method: 'PUT', data: data || this });
	      }
	    }, {
	      key: '$upatch',
	      value: function $upatch(data) {
	        return this.$ureq({ method: 'PATCH', data: data || this });
	      }
	    }, {
	      key: '$patch',
	      value: function $patch(data) {
	        return this.$req({ method: 'PATCH', data: data || this });
	      }
	    }, {
	      key: '$udelete',
	      value: function $udelete() {
	        return this.$ureq({ method: 'DELETE' });
	      }
	    }, {
	      key: '$delete',
	      value: function $delete() {
	        return this.$req({ method: 'DELETE' });
	      }
	    }, {
	      key: '$config',
	      value: function $config(config) {
	        return angular.extend(this.$$config, config);
	      }
	    }]);

	    return Restify;
	  }();

	  return function (baseUrl, callback) {

	    var match = baseUrl.match(/^(https?\:\/\/)?(.+)/) || [];

	    baseUrl = (match[1] || '/') + uriToArray(match[2] || '').join('/');

	    var base = {};

	    var configuerer = {
	      add: function add(route) {

	        route = uriToArray(route);

	        var mergeRoutes = function mergeRoutes(base, route) {

	          if (!_.isEmpty(route)) {

	            var name = route[0];
	            var next = route.slice(1);

	            base[name] = base[name] || {};

	            return mergeRoutes(base[name], next);
	          }
	        };

	        return mergeRoutes(base, route, []);
	      }
	    };

	    callback(configuerer);

	    return new Restify(baseUrl, base, null);
	  };
	}]);

/***/ }
/******/ ]);