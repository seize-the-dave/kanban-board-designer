'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: '.',
    nodeRequire: require
});
var assert = require('assert');
var Board = requirejs('./app/board');

describe('Board', function() {
    // var Board;

    // before(function (done){
    //     // This saves the module foo for use in tests. You have to use
    //     // the done callback because this is asynchronous.
    //     requirejs(['./app/board'], function(boardModule) {
    //         Board = boardModule;
    //         done();
    //     });
    // });

  it('should have no columns by default', function(){
    var board = new Board();
    assert.equal(board.columns.length, 0);
  });
});
