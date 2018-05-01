define(['require', './swimlane'], function(require, Swimlane) {
  function Column(name, maxWip, swimlanes) {
    this.name = name;
    this.maxWip = maxWip;
    this.swimlanes = swimlanes === undefined ? [] : swimlanes;
  }
  Column.prototype.addSwimlane = function(swimlane) {
    this.swimlanes.push(swimlane);
  }
  Column.prototype.removeSwimlane = function(swimlane) {
    this.swimlanes.splice(this.swimlanes.indexOf(swimlane), 1);
  }
  Column.prototype.moveUp = function(swimlane) {
    var offset = this.swimlanes.indexOf(swimlane);
    var upOffset = offset - 1;
    var swap = this.swimlanes[upOffset];
    this.swimlanes[upOffset] = swimlane;
    this.swimlanes[offset] = swap;
  }
  Column.prototype.moveDown = function(swimlane) {
    var offset = this.swimlanes.indexOf(swimlane);
    var downOffset = offset + 1;
    var swap = this.swimlanes[downOffset];
    this.swimlanes[downOffset] = swimlane;
    this.swimlanes[offset] = swap;
  }
  Column.prototype.clone = function() {
    var clone = new Column(this.name, this.maxWip, []);
    this.swimlanes.forEach(function(swimlane) {
      clone.addSwimlane(swimlane.clone());
    });
    return clone;
  }
  Column.prototype.splitColumn = function() {
    this.swimlanes[0].addColumn(new Column('New Column', 1, [new Swimlane('Default')]));
    this.swimlanes[0].addColumn(new Column('New Column', 1, [new Swimlane('Default')]));
  }
  Column.prototype.splitSwimlane = function() {
    var swimlane = this.swimlanes[0].clone();
    swimlane.name = 'New Swimlane';

    this.addSwimlane(swimlane);
  }
  Column.prototype.addAfter = function(currSwimlane, nextSwimlane) {
    var offset = this.swimlanes.indexOf(currSwimlane);
    this.swimlanes.splice(offset + 1, 0, nextSwimlane);
  }
  Column.fromObject = function(o) {
    var c = new Column(o.name, o.maxWip, []);
    o.swimlanes.forEach(function(s) {
      c.addSwimlane(require('./swimlane').fromObject(s));
    });
    return c;
  }

  return Column;
});
