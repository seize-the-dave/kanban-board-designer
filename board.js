var lambdaUrl = "https://euq9lhwui2.execute-api.us-east-1.amazonaws.com/dev/board";

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

function Column(name, maxWip, swimlanes) {
  this.name = name;
  this.maxWip = maxWip;
  this.swimlanes = swimlanes === undefined ? [] : swimlanes;
}
Column.prototype.addSwimlane = function(swimlane) {
  this.swimlanes.push(swimlane);
}
Column.fromObject = function(o) {
  var c = new Column(o.name, o.maxWip, []);
  o.swimlanes.forEach(function(s) {
    c.addSwimlane(Swimlane.fromObject(s));
  });
  return c;
}

function Swimlane(name, wip, columns) {
  this.name = name;
  this.wip = wip;
  this.columns = columns === undefined ? [] : columns;
}
Swimlane.prototype.addColumn = function(column) {
  this.columns.push(column);
}
Swimlane.fromObject = function(o) {
  var s = new Swimlane(o.name, o.wip, []);
  o.columns.forEach(function(c) {
    s.addColumn(Column.fromObject(c));
  });
  return s;
}

var defaultBoard = new Board();
var defaultColumn = new Column('Development', 0);
defaultBoard.addColumn(defaultColumn);

var defaultSwimlane = new Swimlane('Default', 1);
defaultColumn.addSwimlane(defaultSwimlane);

defaultSwimlane.addColumn(new Column('Backlog', 1, [new Swimlane('Default', 1)]));
defaultSwimlane.addColumn(new Column('Ready', 3, [new Swimlane('Default', 1)]));
var developmentColumn = new Column('Development', 5);
defaultSwimlane.addColumn(developmentColumn);
defaultSwimlane.addColumn(new Column('Validation', 4, [new Swimlane('Default', 1)]));
defaultSwimlane.addColumn(new Column('Done', 3, [new Swimlane('Default', 1)]));

var developmentSwimlane = new Swimlane('Default', 1);
developmentColumn.addSwimlane(developmentSwimlane);

developmentSwimlane.addColumn(new Column('In Progress', 3, [new Swimlane('Default', 1)]));
developmentSwimlane.addColumn(new Column('Done', 2, [new Swimlane('Default', 1)]));

var board = defaultBoard;
var boardId;

var calculateColumnWidth = function(column) {
  var columnWidth = 1;
  column.swimlanes.forEach(function(swimlane) {
    columnWidth = Math.max(columnWidth, calculateSwimlaneWidth(swimlane));
  });
  return columnWidth;
}

var calculateSwimlaneWidth = function(container) {
  var swimlaneWidth = 0;

  container.columns.forEach(function(column) {
    swimlaneWidth += calculateColumnWidth(column);
  });

  return swimlaneWidth;
}

var calculateSwimlaneDepth = function(swimlane) {
  var swimlaneDepth = 0;
  if (swimlane.name !== undefined) {
    swimlaneDepth++;
  }
  if (swimlane.columns.length == 0) {
    return swimlaneDepth + 1;
  } else {
    var columnDepth = 1;
    swimlane.columns.forEach(function(column) {
      columnDepth = Math.max(columnDepth, calculateColumnDepth(column));
    });
    swimlaneDepth += columnDepth;
  }

  return swimlaneDepth;
}

var calculateColumnDepth = function(column) {
  var columnDepth = 1;

  column.swimlanes.forEach(function(swimlane) {
    columnDepth += calculateSwimlaneDepth(swimlane);
  });

  return columnDepth;
}

var renderColumn = function(wrapper) {
  var columnHtml = $('<td class="column">');
  var title = wrapper.payload.name;
  var offset = wrapper.parent.columns.indexOf(wrapper.payload);

  if (wrapper.payload.maxWip !== 0) {
    title += ' (' + wrapper.payload.maxWip + ')';
  }
  columnHtml.append(title);
  columnHtml.attr('colspan', wrapper.colspan);
  columnHtml.mouseout(function(e) {
    hideButtons($(this));
  });
  columnHtml.mouseover(function(e) {
    showButtons($(this));
  });

  var columnButtons = $('<div class="buttons btn-group">');
  columnHtml.append(columnButtons);

  var editButton = makeButton('Edit Column', 'fa-edit');
  columnButtons.append(editButton);
  editButton.click(wrapper.payload, function() {
    var modal = $('#columnModal');
    modal.modal('toggle');
    modal.find('.modal-body input#column-name').val(wrapper.payload.name);
    modal.find('.modal-body input#column-wip').val(wrapper.payload.maxWip);

    modal.find('form').submit(function(e) {
      wrapper.payload.name = $('#column-name').val();
      wrapper.payload.maxWip = $('#column-wip').val();
      modal.modal('toggle');

      save(window.board);

      e.preventDefault();
      modal.find('form').off();
    });
  });

  var addButton = makeButton('Add Column', 'fa-plus');
  columnButtons.append(addButton);
  addButton.click(function(e) {
    var swimlanes = JSON.parse(JSON.stringify(wrapper.payload.swimlanes));
    var column = new Column('New Column', 1, swimlanes);

    wrapper.parent.columns.splice(offset, 0, column);
    save(window.board);
  });

  var splitColumnButton = makeButton('Split Column', 'fa-columns');
  columnButtons.append(splitColumnButton);
  if (wrapper.payload.swimlanes.length === 1 && wrapper.payload.swimlanes[0].columns.length === 0) {
    splitColumnButton.click(wrapper.payload, function() {
      var columns = [
        new Column('New Column', 1, [new Swimlane('Default')]),
        new Column('New Column', 1, [new Swimlane('Default')])
      ];
      wrapper.payload.swimlanes[0].columns = columns;

      save(window.board);
    });
  } else {
    splitColumnButton.addClass('disabled');
  }

  var splitSwimlaneButton = makeButton('Split into Swimlanes', 'fa-bars');
  // columnButtons.append(splitSwimlaneButton);
  splitSwimlaneButton.click(function(e) {
    window.alert('TODO');
  });

  var deleteButton = makeButton('Delete Column', 'fa-trash-alt');
  columnButtons.append(deleteButton);
  deleteButton.click(function(e) {
    wrapper.parent.columns.splice(offset, 1);

    save(window.board);
  })

  var moveLeftButton = makeButton('Move Left', 'fa-arrow-left');
  columnButtons.append(moveLeftButton);
  if (offset > 0) {
    console.log(offset);
    moveLeftButton.click(function(e) {
      var leftOffset = offset - 1;
      var swap = wrapper.parent.columns[leftOffset];
      wrapper.parent.columns[leftOffset] = wrapper.payload;
      wrapper.parent.columns[offset] = swap;

      save(window.board);
    });
  } else {
    moveLeftButton.addClass('disabled');
  }

  var moveRightButton = makeButton('Move Right', 'fa-arrow-right');
  columnButtons.append(moveRightButton);
  if (offset < wrapper.parent.columns.length - 1) {
    moveRightButton.click(function(e) {
      var rightOffset = offset + 1;
      var swap = wrapper.parent.columns[rightOffset];
      wrapper.parent.columns[rightOffset] = wrapper.payload;
      wrapper.parent.columns[offset] = swap;

      save(window.board);
    });
  } else {
    moveRightButton.addClass('disabled');
  }

  return columnHtml;
}

var renderCards = function(wrapper) {
  var cardsHtml = $('<td class="cards">');
  cardsHtml.attr('rowspan', wrapper.rowspan);

  var cardBoards = $('<div>').appendTo(cardsHtml);
  var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];

  for (var i = 0; i < wrapper.payload.wip; i++) {
    var randomColour = colours[Math.floor(colours.length * Math.random())];
    cardBoards.append('<div class="card card-' + randomColour + '">');
  }

  return cardsHtml;
}

var renderSwimlane = function(wrapper) {
  var offset = wrapper.parent.swimlanes.indexOf(wrapper.payload);

  var swimlaneHtml = $('<td class="swimlane">');
  swimlaneHtml.append(wrapper.payload.name);
  swimlaneHtml.attr('colspan', wrapper.colspan);
  swimlaneHtml.mouseout(function(e) {
    hideButtons($(this));
  });
  swimlaneHtml.mouseover(function(e) {
    showButtons($(this));
  });

  var swimlaneButtons = $('<div class="btn-group buttons">');
  swimlaneHtml.append(swimlaneButtons);

  var editButton = makeButton('Edit Swimlane', 'fa-edit');
  swimlaneButtons.append(editButton);
  editButton.click(function(e) {
    var modal = $('#swimlaneModal');
    modal.modal('toggle');
    modal.find('.modal-body input#swimlane-name').val(wrapper.payload.name);
    modal.find('.modal-body input#swimlane-wip').val(wrapper.payload.wip);

    modal.find('form').submit(function(e) {
      wrapper.payload.name = $('#swimlane-name').val();
      wrapper.payload.wip = $('#swimlane-wip').val();
      modal.modal('toggle');

      save(window.board);

      e.preventDefault();
      modal.find('form').off();
    });
  })

  var addButton = makeButton('Add Swimlane', 'fa-plus');
  swimlaneButtons.append(addButton);
  addButton.click(function(e) {
    var modal = $('#swimlaneModal');
    modal.modal('toggle');
    modal.find('.modal-body input#swimlane-name').val('New Swimlane');
    modal.find('.modal-body input#swimlane-wip').val(2);

    modal.find('form').submit(function(e) {
      var swimlane = {name: 'New Swimlane', wip: 2};
      swimlane.name = $('#swimlane-name').val();
      swimlane.wip = $('#swimlane-wip').val();
      swimlane.columns = wrapper.payload.columns;
      modal.modal('toggle');

      wrapper.parent.swimlanes.splice(offset, 0, JSON.parse(JSON.stringify(swimlane)));
      save(window.board);

      e.preventDefault();
      modal.find('form').off();
    });
  });

  var deleteButton = makeButton('Delete Swimlane', 'fa-trash-alt');
  swimlaneButtons.append(deleteButton);
  if (wrapper.parent.swimlanes.length > 1) {
    deleteButton.click(function(e) {
      wrapper.parent.swimlanes.splice(offset, 1);

      save(window.board);
    });
  } else {
    deleteButton.addClass('disabled');
  }

  var moveUpButton = makeButton('Move Swimlane Up', 'fa-arrow-up');
  swimlaneButtons.append(moveUpButton);
  if (offset !== 0) {
    moveUpButton.click(function(e) {
      var upOffset = offset - 1;
      var swap = wrapper.parent.swimlanes[upOffset];
      wrapper.parent.swimlanes[upOffset] = wrapper.payload;
      wrapper.parent.swimlanes[offset] = swap;

      save(window.board);
    });
  } else {
    moveUpButton.addClass('disabled');
  }

  var moveDownButton = makeButton('Move Swimlane Down', 'fa-arrow-down');
  swimlaneButtons.append(moveDownButton);
  if (offset < wrapper.parent.swimlanes.length - 1) {
    moveDownButton.click(function(e) {
      var downOffset = offset + 1;
      var swap = wrapper.parent.swimlanes[downOffset];
      wrapper.parent.swimlanes[downOffset] = wrapper.payload;
      wrapper.parent.swimlanes[offset] = swap;

      save(window.board);
    });
  } else {
    moveDownButton.addClass('disabled');
  }

  return swimlaneHtml;
}

var columnToGrid = function(column, grid, offset, colDepth) {
  column.swimlanes.forEach(function(swimlane) {
    grid[offset].push(wrap(swimlane, column, Math.max(1, calculateSwimlaneWidth(swimlane))));
    offset += (swimlaneToGrid(swimlane, grid, offset + 1, colDepth, column.maxWip) + 1);
  });
}

var swimlaneToGrid = function(swimlane, grid, offset, colDepth, colWip) {
  if (swimlane.columns.length > 0) {
    var longestColumn = 1;
    swimlane.columns.forEach(function(column) {
      longestColumn = Math.max(longestColumn, calculateColumnDepth(column));
    });
    swimlane.columns.forEach(function(column) {
      var colDepth = (longestColumn - calculateColumnDepth(column)) + 1;
      grid[offset].push(wrap(column, swimlane, calculateColumnWidth(column)));

      columnToGrid(column, grid, offset + 1, colDepth);
    });

    return longestColumn;
  } else {
    grid[offset].push(wrap({name: 'Cards', wip: colWip}, {}, 1, colDepth));

    return 1;
  }
}

var wrap = function(payload, parent, colspan, rowspan) {
  return {
    payload: payload,
    parent: parent,
    colspan: colspan,
    rowspan: rowspan
  }
}

var render = function(board) {
  $('.tooltip').remove();

  var swimlanes = board.columns;
  var boardWidth = calculateSwimlaneWidth(board);
  var boardDepth = calculateSwimlaneDepth(board, 0);

  var grid = Array(boardDepth).fill(null).map(x => []);
  swimlaneToGrid(board, grid, 0);

  $('#board').empty();
  var table = $('<table>').appendTo('#board');
  var tbody = $('<tbody>').appendTo(table);
  grid.forEach(function(row) {
    var tableRow = $('<tr>').appendTo(tbody);
    row.forEach(function(cell) {
      var payload = cell.payload;
      if (cell.payload.swimlanes !== undefined) {
        tableRow.append(renderColumn(cell));
      } else if (payload.columns !== undefined) {
        tableRow.append(renderSwimlane(cell));
      } else {
        tableRow.append(renderCards(cell));
      }
    });
  });
}

var findPosition = function(indices) {
  return indices.pop();
}

var toggle = function(id) {
  if ($(id).css('display') == 'none') {
    $(id).css('display', 'block');
  } else {
    $(id).css('display', 'none');
  }
}

var showButtons = function(target) {
  target.find('div.btn-group').css('display', 'inline-block');
}

var hideButtons = function(target) {
  target.find('div.btn-group').css('display', 'none');
}

var makeButton = function(title, icon) {
  return $('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="' + title + '"><i class="fas ' + icon + '"></i></button>');
}

var save = function(board) {
  $.ajax({
    type: "PUT",
    url: lambdaUrl + "?board=" + window.boardId,
    data: JSON.stringify({"board": board}),
    dataType: 'text',
  }).done(function() {
    render(board);
  });
}

var load = function(boardId) {
  $.ajax({
      type: "GET",
      url: lambdaUrl + "?board=" + boardId,
      dataType: 'json',
  }).done(function(data) {
    window.board = data.board;
    render(window.board);
  })
}

$('#board').ready(function(){
  $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  window.boardId = new URL(window.location).searchParams.get("board");

  if (window.boardId == null) {
    $.ajax({
      type: "POST",
      url: lambdaUrl,
      data: JSON.stringify({"board": window.board}),
      dataType: 'text',
    }).done(function(data, textStatus, jqXHR) {
      window.boardId = new URL(jqXHR.getResponseHeader("location"), new URL(window.location)).searchParams.get("board");
      history.pushState({}, "Board", '?board=' + window.boardId);

      render(window.board);
    });
  } else {
    load(window.boardId);
  }
});
