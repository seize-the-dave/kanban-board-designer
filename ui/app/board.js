define(['./column', './swimlane'], function(Column, Swimlane) {
  function Board() {
    this.id = null;
    this.columns = [];
  }
  Board.prototype.addColumn = function(column) {
    this.columns.push(column);
  }
  Board.prototype.removeColumn = function(column) {
    if (this.columns.indexOf(column) === -1) {
      return;
    }
    this.columns.splice(this.columns.indexOf(column), 1);
  }
  Board.prototype.addAfter = function(currColumn, nextColumn) {
    var offset = this.columns.indexOf(currColumn);
    if (offset === -1) {
      return;
    }
    this.columns.splice(offset + 1, 0, nextColumn);
  }
  Board.prototype.moveLeft = function(column) {
    var offset = this.columns.indexOf(column);
    var leftOffset = offset - 1;
    var swap = this.columns[leftOffset];
    this.columns[leftOffset] = column;
    this.columns[offset] = swap;
  }
  Board.prototype.moveRight = function(column) {
    var offset = this.columns.indexOf(column);
    var rightOffset = offset + 1;
    var swap = this.columns[rightOffset];
    this.columns[rightOffset] = column;
    this.columns[offset] = swap;
  }
  Board.fromObject = function(o) {
    var b = new Board();
    b.id = o.id;
    o.columns.forEach(function(c) {
      b.addColumn(Column.fromObject(c));
    });
    return b;
  }

  return Board;
});
