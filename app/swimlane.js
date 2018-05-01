define(['require', './column'], function(require, Column) {
  function Swimlane(name, wip, columns) {
    this.name = name;
    this.wip = wip;
    this.columns = columns === undefined ? [] : columns;
  }
  Swimlane.prototype.addColumn = function(column) {
    this.columns.push(column);
  }
  Swimlane.prototype.removeColumn = function(column) {
    this.columns.splice(this.columns.indexOf(column), 1);
  }
  Swimlane.prototype.clone = function() {
    var clone = new Swimlane(this.name, this.wip, []);
    this.columns.forEach(function(column) {
      clone.addColumn(column.clone());
    });
    return clone;
  }
  Swimlane.prototype.addAfter = function(currColumn, nextColumn) {
    var offset = this.columns.indexOf(currColumn);
    this.columns.splice(offset + 1, 0, nextColumn);
  }
  Swimlane.prototype.moveLeft = function(column) {
    var offset = this.columns.indexOf(column);
    var leftOffset = offset - 1;
    var swap = this.columns[leftOffset];
    this.columns[leftOffset] = column;
    this.columns[offset] = swap;
  }
  Swimlane.prototype.moveRight = function(column) {
    var offset = this.columns.indexOf(column);
    var rightOffset = offset + 1;
    var swap = this.columns[rightOffset];
    this.columns[rightOffset] = column;
    this.columns[offset] = swap;
  }
  Swimlane.fromObject = function(o) {
    var s = new Swimlane(o.name, o.wip, []);
    o.columns.forEach(function(c) {
      s.addColumn(require('./column').fromObject(c));
    });
    return s;
  }

  return Swimlane;
});
