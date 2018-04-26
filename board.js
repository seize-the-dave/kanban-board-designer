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

// var board = {
//   "board": {
//     "swimlanes": [
//       {
//         name: "Expedite",
//         wip: 1,
//         "columns": [
//           {name: "Backlog", maxWip: 1},
//           {name: "Ready", maxWip: 3},
//           {name: "Development", maxWip: 5, "columns": [
//             {name: "In Progress", maxWip: 3},
//             {name: "Done", maxWip: 2},
//           ]},
//           {name: "Validation", maxWip: 4},
//           {name: "Done", maxWip: 3}
//         ],
//       },
//       {
//         name: "Standard",
//         wip: 4,
//         "columns": [
//           {name: "Backlog", maxWip: 1},
//           {name: "Ready", maxWip: 3},
//           {name: "Development", maxWip: 5, "columns": [
//             {name: "In Progress", maxWip: 3},
//             {name: "Done", maxWip: 2},
//           ]},
//           {name: "Validation", maxWip: 4},
//           {name: "Done", maxWip: 3}
//         ],
//       }
//     ]
//   }
// };
var board = defaultBoard;
var boardId;

var deleteColumn = function(swimlane, indices) {
  var offset = indices.pop();
  var container = containerForIndices(swimlane, indices);
  container.columns.splice(offset, 1);
  if (container.columns.length === 0) {
    delete container.columns;
  }

  save(window.board);
}

var addColumn = function(swimlane, indices) {
  var modal = $('#columnModal');
  modal.modal('toggle');
  modal.find('.modal-body input#column-name').val('New Column');
  modal.find('.modal-body input#column-wip').val(1);

  modal.find('form').submit(function(e) {
    var column = {};
    column.name = $('#column-name').val();
    column.maxWip = $('#column-wip').val();
    modal.modal('toggle');

    var offset = indices.pop();
    var container = containerForIndices(swimlane, indices);
    container.columns.splice(offset, 0, column);
    save(window.board);

    e.preventDefault();
    modal.find('form').off();
  });
}

var editColumn = function(swimlane, indices) {
  var container = containerForIndices(swimlane, indices);
  var modal = $('#columnModal');
  modal.modal('toggle');
  modal.find('.modal-body input#column-name').val(container.name);
  modal.find('.modal-body input#column-wip').val(container.maxWip);

  modal.find('form').submit(function(e) {
    container.name = $('#column-name').val();
    container.maxWip = $('#column-wip').val();
    modal.modal('toggle');

    save(window.board);

    e.preventDefault();
    modal.find('form').off();
  });
}

var saveColumn = function(offset) {
  var container = containerForIndices($('#column-indices').val().split(','));

  container.name = $('#column-name').val();
  container.maxWip = $('#column-wip').val()
  $(function () {
     $('#columnModal').modal('toggle');
  });

  save(window.board);
}

var addSwimlane = function(offset, columns) {
  var modal = $('#swimlaneModal');
  modal.modal('toggle');
  modal.find('.modal-body input#swimlane-name').val('New Swimlane');
  modal.find('.modal-body input#swimlane-wip').val(2);

  modal.find('form').submit(function(e) {
    var swimlane = {name: 'New Swimlane', wip: 2};
    swimlane.name = $('#swimlane-name').val();
    swimlane.wip = $('#swimlane-wip').val();
    swimlane.columns = columns;
    modal.modal('toggle');

    window.board.board.swimlanes.splice(offset, 0, swimlane);
    save(window.board);

    e.preventDefault();
    modal.find('form').off();
  });
}

var editSwimlane = function(offset) {
  var swimlane = window.board.board.swimlanes[offset];

  var modal = $('#swimlaneModal');
  modal.modal('toggle');
  modal.find('.modal-body input#swimlane-name').val(swimlane.name);
  modal.find('.modal-body input#swimlane-wip').val(swimlane.wip);

  modal.find('form').submit(function(e) {
    swimlane.name = $('#swimlane-name').val();
    swimlane.wip = $('#swimlane-wip').val();
    modal.modal('toggle');

    save(window.board);

    e.preventDefault();
    modal.find('form').off();
  });
}

var splitColumn = function(column) {
  var modal = $('#columnModal');
  modal.modal('toggle');
  modal.find('.modal-body input#column-name').val('New Column');
  modal.find('.modal-body input#column-wip').val(1);

  modal.find('form').submit(function(e) {
    var subColumnA = {};
    subColumnA.name = $('#column-name').val();
    subColumnA.maxWip = $('#column-wip').val();

    var subColumnB = {};
    subColumnB.name = $('#column-name').val();
    subColumnB.maxWip = $('#column-wip').val();
    modal.modal('toggle');

    column.columns = [subColumnA, subColumnB];
    save(window.board);

    e.preventDefault();
    $(this).off(e);
  });
}

var delSwimlane = function(offset) {
  window.board.board.swimlanes.splice(offset, 1);

  save(window.board);
}

var containerForIndices = function(swimlane, indices) {
  var container = swimlane;
  for (var i = 0; i < indices.length; i++) {
    container = container.columns[indices[i]];
  }
  return container;
}

var swapSwimlanes = function(from, to) {
  var swimlaneFrom = window.board.board.swimlanes[from];
  var swimlaneTo = window.board.board.swimlanes[to];

  window.board.board.swimlanes[to] = swimlaneFrom;
  window.board.board.swimlanes[from] = swimlaneTo;

  save(window.board);
}

var swapColumn = function(swimlane, from, to) {
  var fromIndex = from.pop();
  var toIndex = to.pop();

  var fromColumns = containerForIndices(swimlane, from);
  var toColumns = containerForIndices(swimlane, to);

  var fromCol = fromColumns.columns[fromIndex];
  var toCol = toColumns.columns[toIndex];

  fromColumns.columns[fromIndex] = toCol;
  toColumns.columns[toIndex] = fromCol;

  save(window.board);
}

var makeColumnHeaders = function(tableHeader, pivot, swimlane) {
  for (var i = 0; i < pivot.length; i++) {
      var row = pivot[i];
      var tableHeaderRow = $('<tr>').appendTo(tableHeader);
      var nonEmptyCols = row.filter(column => column.name !== undefined).length;
      for (var j = 0; j < row.length; j++) {
        var column = row[j];
        tableHeaderRow.append(makeColumnHeader(column, nonEmptyCols, swimlane));
      }
  }
}

var augment = function(container, indices) {
  if (container.columns === undefined) {
    return;
  }
  var span = 0;
  for (var i = 0; i < container.columns.length; i++) {
    var indicesClone = indices.slice(0);
    indicesClone.push(i);
    var column = container.columns[i];
    if (column.columns === undefined) {
      column.span = 1;
    } else {
      augment(column, indicesClone);
      column.span = column.columns.reduce((accum, curr) => accum + curr.span, 0);
    }
    column.indices = indicesClone;
  }
}

var findDepth = function(container) {
  var depth = 1;
  if (container.columns === undefined) {
    return depth;
  }
  for (var i = 0; i < container.columns.length; i++) {
    var colDepth = 1;
    var column = container.columns[i];
    if (column.columns !== undefined) {
      colDepth += findDepth(column);
    }
    depth = Math.max(depth, colDepth);
  }
  return depth;
}

var fillIn = function(pivot, columns, offset) {
  if (columns === undefined) {
    return;
  }
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    pivot[offset].push(column);
    if (column.columns === undefined) {
      for (var j = offset + 1; j < pivot.length; j++) {
        pivot[j].push({span: 1});
      }
    } else {
      fillIn(pivot, column.columns, offset + 1);
    }
  }
}

var collectWipLimits = function(container, limits) {
  if (container.columns === undefined) {
    return limits.push(Number(container.maxWip));
  } else {
    for (var i = 0; i < container.columns.length; i++) {
      collectWipLimits(container.columns[i], limits);
    }
  }
}

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
  var swimlaneDepth = 1;
  swimlane.columns.forEach(function(column) {
    swimlaneDepth = Math.max(swimlaneDepth, calculateColumnDepth(column));
  });

  return swimlaneDepth;
}

var calculateColumnDepth = function(column) {
  var columnDepth = 2;
  column.swimlanes.forEach(function(swimlane) {
    columnDepth += calculateSwimlaneDepth(swimlane);
  });
  return columnDepth;
}

var renderColumn = function(wrapper) {
  var columnHtml = $('<td class="column">');
  columnHtml.append(wrapper.payload.name + ' (' + wrapper.payload.maxWip + ')');
  columnHtml.attr('colspan', wrapper.colspan);
  columnHtml.mouseout(function(e) {
    hideButtons($(this));
  });
  columnHtml.mouseover(function(e) {
    showButtons($(this));
  });

  var columnButtons = $('<div class="buttons btn-group">');

  var editButton = makeButton('Edit Column', 'fa-edit');
  // editButton.click([swimlane, indices], function(e) {
  //   editColumn(e.data[0], e.data[1]);
  // })
  columnButtons.append(editButton);

  var addButton = makeButton('Add Column', 'fa-plus');
  // addButton.click([swimlane, rightIndices], function(e) {
  //   addColumn(e.data[0], e.data[1]);
  // });
  columnButtons.append(addButton);

  var splitColumnButton = makeButton('Split Column', 'fa-columns');
  // if (column.columns === undefined) {
  //   splitButton.click(column, function(e) {
  //     splitColumn(e.data, 2);
  //   });
  // } else {
  //   splitButton.attr('disabled', 'disabled');
  // }
  columnButtons.append(splitColumnButton);

  var splitSwimlaneButton = makeButton('Split into Swimlanes', 'fa-bars');
  // if (column.columns === undefined) {
  //   splitButton.click(column, function(e) {
  //     splitColumn(e.data, 2);
  //   });
  // } else {
  //   splitButton.attr('disabled', 'disabled');
  // }
  columnButtons.append(splitSwimlaneButton);

  var deleteButton = makeButton('Delete Column', 'fa-trash-alt');
  // deleteButton.click([swimlane, indices], function(e) {
  //   deleteColumn(e.data[0], e.data[1]);
  // })
  columnButtons.append(deleteButton);

  var moveLeftButton = makeButton('Move Left', 'fa-arrow-left');
  // if (thisOffset !== 0) {
  //   moveLeftButton.click([swimlane, indices, leftIndices], function(e) {
  //     swapColumn(e.data[0], e.data[1], e.data[2]);
  //   });
  // } else {
  //   moveLeftButton.attr('disabled', 'disabled');
  // }
  columnButtons.append(moveLeftButton);

  var moveRightButton = makeButton('Move Right', 'fa-arrow-right');
  // if (thisOffset < (cols - 1)) {
  //   moveRightButton.click([swimlane, indices, rightIndices], function(e) {
  //     swapColumn(e.data[0], e.data[1], e.data[2]);
  //   });
  // } else {
  //   moveRightButton.attr('disabled', 'disabled');
  // }
  columnButtons.append(moveRightButton);
  columnHtml.append(columnButtons);

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
  var editButton = makeButton('Edit Swimlane', 'fa-edit');
  // editButton.click(i, function(e) {
  //   editSwimlane(e.data);
  // })
  swimlaneButtons.append(editButton);

  var addButton = makeButton('Add Swimlane', 'fa-plus');
  // addButton.click([i + 1, swimlane.columns], function(e) {
  //   addSwimlane(e.data[0], e.data[1]);
  // });
  swimlaneButtons.append(addButton);

  var deleteButton = makeButton('Delete Swimlane', 'fa-trash-alt');
  // if (swimlanes.length > 1) {
  //   deleteButton.click(i, function(e) {
  //     delSwimlane(e.data);
  //   })
  // } else {
  //   deleteButton.attr('disabled', 'disabled');
  // }
  swimlaneButtons.append(deleteButton);

  var moveUpButton = makeButton('Move Swimlane Up', 'fa-arrow-up');
  // if (i !== 0) {
  //   moveUpButton.click(i, function(e) {
  //     swapSwimlanes(e.data, e.data - 1);
  //   })
  // } else {
  //   moveUpButton.attr('disabled', 'disabled');
  // }
  swimlaneButtons.append(moveUpButton);

  var moveDownButton = makeButton('Move Swimlane Down', 'fa-arrow-down');
  // if (i < swimlanes.length - 1) {
  //   moveDownButton.click(i, function(e) {
  //     swapSwimlanes(e.data, e.data + 1);
  //   });
  // } else {
  //   moveDownButton.attr('disabled', 'disabled');
  // }
  swimlaneButtons.append(moveDownButton);
  swimlaneHtml.append(swimlaneButtons);

  return swimlaneHtml;
}

var columnToGrid = function(column, grid, offset, colDepth) {
  column.swimlanes.forEach(function(swimlane) {
    grid[offset].push(wrap(swimlane, Math.max(1, calculateSwimlaneWidth(swimlane))));
    swimlaneToGrid(swimlane, grid, offset + 1, colDepth, column.maxWip);
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
      grid[offset].push(wrap(column, calculateColumnWidth(column)));
      columnToGrid(column, grid, offset + 1, colDepth);
    });
  } else {
    grid[offset].push(wrap({name: 'Cards', wip: colWip}, 1, colDepth));
  }
}

var wrap = function(payload, colspan, rowspan) {
  return {
    payload: payload,
    colspan: colspan,
    rowspan: rowspan
  }
}

var render = function(board) {
  $('.tooltip').remove();

  var swimlanes = board.columns;
  var boardWidth = calculateSwimlaneWidth(board);
  var boardDepth = calculateSwimlaneDepth(board, 0);
  console.log(boardWidth + 'x' + boardDepth);

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

var makeColumnHeader = function(column, filledCols, swimlane) {
  var tableHeader = $('<th colspan="' + column.span + '">');
  if (column.indices) {
    tableHeader.mouseout(function(e) {
      hideButtons($(this));
    });
    tableHeader.mouseover(function(e) {
      showButtons($(this));
    });
  }
  if (column.name !== undefined) {
    renderColumnName(tableHeader, column, filledCols, swimlane);
  }
  return tableHeader;
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

var renderColumnName = function(headerCell, column, cols, swimlane) {
  var indices = column.indices;
  var thisOffset = findPosition(indices.slice(0));

  var rightIndices = indices.slice(0);
  rightIndices.pop();
  rightIndices.push(thisOffset + 1);

  var leftIndices = indices.slice(0);
  leftIndices.pop();
  leftIndices.push(thisOffset - 1);

  var indicesString = JSON.stringify(indices);
  var buttons_id = 'column_' + indices.join('_');
  var titleDiv = $('<div>').appendTo(headerCell)
  titleDiv.append(column.name + ' (' + column.maxWip + ')');

  var buttons = $('<div class="buttons btn-group" id="' + buttons_id + '">').appendTo(headerCell);

  var editButton = makeButton('Edit Column', 'fa-edit');
  editButton.click([swimlane, indices], function(e) {
    editColumn(e.data[0], e.data[1]);
  })
  buttons.append(editButton);

  var addButton = makeButton('Add Column', 'fa-plus');
  addButton.click([swimlane, rightIndices], function(e) {
    addColumn(e.data[0], e.data[1]);
  });
  buttons.append(addButton);

  var splitButton = makeButton('Split Column', 'fa-columns');
  if (column.columns === undefined) {
    splitButton.click(column, function(e) {
      splitColumn(e.data, 2);
    });
  } else {
    splitButton.attr('disabled', 'disabled');
  }
  buttons.append(splitButton);

  var deleteButton = makeButton('Delete Column', 'fa-trash-alt');
  deleteButton.click([swimlane, indices], function(e) {
    deleteColumn(e.data[0], e.data[1]);
  })
  buttons.append(deleteButton);

  var moveLeftButton = makeButton('Move Left', 'fa-arrow-left');
  if (thisOffset !== 0) {
    moveLeftButton.click([swimlane, indices, leftIndices], function(e) {
      swapColumn(e.data[0], e.data[1], e.data[2]);
    });
  } else {
    moveLeftButton.attr('disabled', 'disabled');
  }
  buttons.append(moveLeftButton);

  var moveRightButton = makeButton('Move Right', 'fa-arrow-right');
  if (thisOffset < (cols - 1)) {
    moveRightButton.click([swimlane, indices, rightIndices], function(e) {
      swapColumn(e.data[0], e.data[1], e.data[2]);
    });
  } else {
    moveRightButton.attr('disabled', 'disabled');
  }
  buttons.append(moveRightButton);
}

var makeButton = function(title, icon) {
  return $('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="' + title + '"><i class="fas ' + icon + '"></i></button>');
}

var makeCardColumn = function(wip, span) {
  var lowerWip = Math.max(2, wip - 1);
  var range = wip - lowerWip;

  var tableBodyCell = $('<td colspan="' + span + '">');
  var cardBoards = $('<div class="column-1">').appendTo(tableBodyCell);
  var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];

  var cards = lowerWip + Math.floor(range * Math.random())
  for (var i = 0; i < cards; i++) {
    var randomColour = colours[Math.floor(colours.length * Math.random())];
    cardBoards.append('<div class="card card-' + randomColour + '">');
  }

  return tableBodyCell;
}

var save = function(board) {
  $.ajax({
    type: "PUT",
    url: lambdaUrl + "?board=" + board.id,
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
