'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: '.',
    nodeRequire: require
});
var assert = require('assert');
var Swimlane = requirejs('./app/swimlane');
var Column = requirejs('./app/column');

describe('Swimlane', function() {
  it('should have no columns by default', function(){
    var swimlane = new Swimlane();
    assert.equal(swimlane.columns.length, 0);
  });

  describe('#addColumn', function() {
    it('should add one column to the columns list', function() {
      var board = new Swimlane();
      board.addColumn(new Column('Foo', 1));

      assert.equal(board.columns.length, 1);
    });
    it('should add each column to the end of the columns list', function() {
      var board = new Swimlane();
      board.addColumn(new Column('Foo', 1));
      board.addColumn(new Column('Bar', 1));

      assert.equal(board.columns.pop().name, 'Bar');
    });
  });
  describe('#removeColumn', function() {
    it('should remove added columns', function() {
      var board = new Swimlane();
      var column = new Column('Foo', 1);
      board.addColumn(column);
      board.removeColumn(column);

      assert.equal(board.columns.length, 0);
    });
    it('should not remove columns which have not been added', function() {
      var board = new Swimlane();
      board.addColumn(new Column('Foo', 1));
      board.removeColumn(new Column('Bar', 1));

      assert.equal(board.columns.length, 1);
    });
  });
  describe('#addAfter', function() {
    it('should not add after missing column', function() {
      var board = new Swimlane();
      var column = new Column('Foo', 1);
      board.addColumn(column);
      board.addAfter(new Column('Bar', 2), column);

      assert.equal(board.columns.length, 1);
    });
    it('should add after column', function() {
      var board = new Swimlane();
      var first = new Column('Foo', 1);
      var second = new Column('Bar', 1);
      board.addColumn(first);
      board.addAfter(first, second);

      assert.equal(board.columns.length, 2);
      assert.equal(board.columns[1], second);
    });
    it('should add between columns', function() {
      var board = new Swimlane();
      var first = new Column('Foo', 1);
      var second = new Column('Bar', 1);
      var third = new Column('Baz', 1);
      board.addColumn(first);
      board.addColumn(third);
      board.addAfter(first, second);

      assert.equal(board.columns.length, 3);
      assert.equal(board.columns[1], second);
    });
  });
});
