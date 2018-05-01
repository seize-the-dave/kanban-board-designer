define(['./column', './swimlane'], function(Column, Swimlane) {
  function Board() {
    this.columns = [];
  }
  Board.prototype.addColumn = function(column) {
    this.columns.push(column);
  }
  Board.fromObject = function(o) {
    var b = new Board();
    o.columns.forEach(function(c) {
      b.addColumn(Column.fromObject(c));
    });
    return b;
  }

  return Board;
});
