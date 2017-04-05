/*
 * Restify v0.3.1
 * (c) 2013 Ilan Frumer
 * License: MIT
*/

'use strict';

angular.module('restify', []);

let original = {};

angular.module('restify').config(['$httpProvider', function($httpProvider){
  original.transformRequest  = $httpProvider.defaults.transformRequest[0];
  original.transformResponse = $httpProvider.defaults.transformResponse[0];
}

]);

angular.module('restify').factory('restify', ['$http','$q', function($http, $q){

  //# helpers

  let uriToArray = uri=> _.filter(uri.split('/'),a=> a);

  //# wrap response data with resified objects


  let restify = function(data, wrap){

    let newElement = null;

    if (_.isObject(data)) {

      let $id = null;
      let $route = this.$$route;

      for (let key in this.$$route) {
        let val = this.$$route[key];
        if (/^:/.test(key)) {
          $id = key.match(/^:(.+)/)[1];
          $route = val;
          break;
        }
      }

      if (_.isArray(data)) {

        newElement = new Restify(this.$$url,this.$$route,this.$$parent);

        if($id) {

          data = _.map(data, function(item){

            if (item[$id]) {
              return _.extend(new Restify(`${newElement.$$url}/${item[$id]}`, $route, newElement), item);
            } else {
              return item;
            }
          });
        }

        newElement.push(...data);

      } else {

        if ($id && data[$id]) {
          newElement = new Restify(`${this.$$url}/${data[$id]}`,this.$$route, this);
        } else {
          newElement = new Restify(this.$$url, this.$$route, this.$$parent);
        }

        newElement = _.extend(newElement, data);
      }

    } else {
      newElement = new Restify(this.$$url, this.$$route, this.$$parent);
      newElement.data = data;
    }

    return newElement;
  };

  //# unwrap request data from resified objects

  let deRestify = function(obj){
    if (angular.isObject(obj)) {
      return _.omit((obj) , (v,k)=> /^\$/.test(k));
    }
  };

  //# class

  class Restify{

    constructor(base, route, parent){
      this.$$url = base;
      this.$$route = route;
      this.$$parent = parent;
      this.$$config = {};
      this.push = Object.create(Array.prototype.push);

      for (let key in route) {
        let val = route[key];
        if (base === '/') { base = ''; }
        if (/^:/.test(key)) {
          let $id = key.match(/^:(.+)/)[1];
          this[`$${$id}`] = function(id){
            return new Restify(`${base}/${id}`, val, this);
          };
        } else {
          this[`$${key}`] = new Restify(`${base}/${key}`, val, this);
        }
      }
    }

    $req(config, wrap){

      if (wrap == null) { wrap = true; }
      let conf = {};
      if (config.data) { config.data = deRestify(config.data); }
      config.url = this.$$url;

      angular.extend(conf, this.$$config , config);

      // defaults
      conf.method = conf.method || 'GET';
      if (_.isEmpty(conf.params)) { delete conf.params; }

      return $http(conf).then(response=> {
        if (wrap) { response.data = restify.call(this, response.data); }
        return response.data;
      }
      );
    }

    $ureq(config){ return this.$req(config, false); }

    $uget(params){ if (params === null) { params = {}; } return this.$ureq({method: 'GET' , params}); }
    $get(params){ if (params === null) { params = {}; } return this.$req({method: 'GET' , params}); }

    $upost(data) { return this.$ureq({method: 'POST', data: data || this}); }
    $post(data) { return this.$req({method: 'POST', data: data || this}); }

    $uput(data) { return this.$ureq({method: 'PUT', data: data || this}); }
    $put(data) { return this.$req({method: 'PUT', data: data || this}); }

    $upatch(data) { return this.$ureq({method: 'PATCH', data: data || this}); }
    $patch(data) { return this.$req({method: 'PATCH', data: data || this}); }

    $udelete() { return this.$ureq({method: 'DELETE'}); }
    $delete() { return this.$req({method: 'DELETE'}); }

    $config(config){ return angular.extend(this.$$config,config); }
  }

  return function(baseUrl, callback){

    let match = baseUrl.match(/^(https?\:\/\/)?(.+)/) || [];

    baseUrl = (match[1] || '/') + uriToArray(match[2] || '').join('/');

    let base = {};

    let configuerer = {
      add(route){

        route = uriToArray(route);

        let mergeRoutes = function(base, route){

          if (!_.isEmpty(route)) {

            let name = route[0];
            let next = route.slice(1);

            base[name] = base[name] || {};

            return mergeRoutes(base[name], next);
          }
        };

        return mergeRoutes(base, route, []);
      }
    };

    callback(configuerer);

    return new Restify(baseUrl, base , null);
  };
}
]);
