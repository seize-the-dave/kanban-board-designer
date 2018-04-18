var lambdaUrl = "https://euq9lhwui2.execute-api.us-east-1.amazonaws.com/dev/board";

var board = {
  "board": {
    "columns": [
      {name: "To Do", maxWip: 1},
      {name: "Ready", maxWip: 3},
      {name: "Development", maxWip: 5, "columns": [
        {name: "In Progress", maxWip: 3},
        {name: "Done", maxWip: 3},
      ]},
      {name: "Validation", maxWip: 4},
      {name: "Done", maxWip: 3}
    ],
    "swimlanes": [
      {name: "Expedite", wip: 1},
      {name: "Standard", wip: 4}
    ]
  }
};
var boardId;

var delColumn = function(indices) {
  var container = containerForIndices(indices.slice(0, -1));
  container.columns.splice(indices.pop(), 1);

  // First row and remaining columns
  if (indices.length !== 0 && container.columns.length === 0) {
    delete container.columns;
  }

  save(window.board);
}

var newColumn = function() {
  return {name: window.prompt('Column Name', 'New Column'), maxWip: 1};
}

var addColumn = function(indices) {
  var container = containerForIndices(indices.slice(0, -1));
  container.columns.splice(indices.pop(), 0, newColumn());

  save(window.board);
}

var newSwimlane = function() {
  return {name: window.prompt('Swimlane Name', 'New Swimlane'), wip: 2};
}

var addSwimlane = function(offset) {
  window.board.board.swimlanes.splice(offset, 0, newSwimlane());

  save(window.board);
}

var delSwimlane = function(offset) {
  window.board.board.swimlanes.splice(offset, 1);

  save(window.board);
}

var containerForIndices = function(indices) {
  var container = window.board.board;
  for (var i = 0; i < indices.length; i++) {
    container = container.columns[indices[i]];
  }
  return container;
}

var renameColumn = function(indices) {
  var container = containerForIndices(indices);
  container.name = window.prompt('Rename Column', container.name);

  save(window.board);
}

var renameSwimlane = function(offset) {
  var swimlane = window.board.board.swimlanes[offset];
  swimlane.name = window.prompt('Rename Swimlane', swimlane.name);
  swimlane.wip = window.prompt('Swimlane WIP', swimlane.wip);

  save(window.board);
}

var swapSwimlanes = function(from, to) {
  var swimlaneFrom = window.board.board.swimlanes[from];
  var swimlaneTo = window.board.board.swimlanes[to];

  window.board.board.swimlanes[to] = swimlaneFrom;
  window.board.board.swimlanes[from] = swimlaneTo;

  save(window.board);
}

var splitColumn = function(indices) {
  var container = containerForIndices(indices);
  container.columns = [
    newColumn(),
    newColumn()
  ];

  save(window.board);
}

var changeMaxWip = function(indices) {
  var container = containerForIndices(indices);
  container.maxWip = window.prompt('Change Maxiumum WIP', container.maxWip);

  save(window.board);
}

var swapColumn = function(fromIndices, toIndices) {
  var fromColumns = window.board.board.columns;
  for (var i = 0; i < fromIndices.length - 1; i++) {
    fromColumns = fromColumns[fromIndices[i]].columns;
  }
  var fromIndex = fromIndices.pop();

  var toColumns = window.board.board.columns;
  for (var i = 0; i < toIndices.length - 1; i++) {
    toColumns = toColumns[toIndices[i]].columns;
  }
  var toIndex = toIndices.pop();

  var fromCol = fromColumns[fromIndex];
  var toCol = toColumns[toIndex];

  fromColumns[fromIndex] = toCol;
  toColumns[toIndex] = fromCol;

  save(window.board);
}

var renderHeader = function(tableHeader, columns, pivot) {
  for (var i = 0; i < pivot.length; i++) {
      var row = pivot[i];
      var tableHeaderRow = $('<tr>').appendTo(tableHeader);
      var filledCols = row.filter(column => column.name !== undefined);
      for (var j = 0; j < pivot[i].length; j++) {
        var column = row[j];
        var tableHeaderCell = renderTableHeader(tableHeaderRow, column.span);
        if (column.name !== undefined) {
          renderColumnName(tableHeaderCell, column, filledCols.length);
        }
      }
  }
}

var augment = function(container, indices) {
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

var render = function(board) {
  $('.tooltip').css('display', 'none');
  
  var columns = board.board.columns;
  var size = Math.floor(12 / columns.length);

  var augmentedBoard = Object.assign(board['board'], {});
  augment(augmentedBoard, []);
  var depth = findDepth(augmentedBoard);

  var pivot = Array(depth).fill(null).map(x => []);
  fillIn(pivot, augmentedBoard.columns, 0);

  $('#board').empty();

  var table = $('<table>').appendTo('#board');
  var tableHeader = $('<thead>').appendTo(table);
  renderHeader(tableHeader, columns, pivot);

  var lastRow = pivot.pop().length;

  var swimlanes = board.board.swimlanes;
  var tableBody = $('<tbody>').appendTo(table);
  for (var i = 0; i < swimlanes.length; i++) {
    var swimlane = swimlanes[i];
    var swimlaneRow = $('<tr>').appendTo(tableBody);
    var swimlaneCell = $('<th class="swimlane" colspan="' + lastRow + '"><a href="#" onclick="renameSwimlane(' + i + ')">' + swimlane.name + '</a>').appendTo(swimlaneRow);
    var swimlaneButtons = $('<br/><div class="btn-group buttons">').appendTo(swimlaneCell);
    if (i === 0) {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Swimlane Up"><i class="fas fa-arrow-up"></i></button></div>');
    } else {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Swimlane Up" onclick="swapSwimlanes(' + i + ',' + (i - 1) + ')"><i class="fas fa-arrow-up"></i></button></div>');
    }
    swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Add Swimlane" onclick="addSwimlane(' + (i + 1) + ')"><i class="fas fa-plus"></i></button></div>');
    swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Delete Swimlane" onclick="delSwimlane(' + i + ');"><i class="fas fa-trash-alt"></i></button>');
    if (i === swimlanes.length - 1) {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Swimlane Down"><i class="fas fa-arrow-down"></i></button></div>');
    } else {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Swimlane Down" onclick="swapSwimlanes(' + i + ',' + (i + 1) + ')"><i class="fas fa-arrow-down"></i></button></div>');
    }
    var tableBodyRow = $('<tr>').appendTo(tableBody);
    for (var j = 0; j < lastRow; j++) {
      renderCardColumn(tableBodyRow, swimlane.wip);
    }
    // renderAdsenseCardColumn(tableBodyRow);
  }
}

var renderTableHeader = function(tableHeaderRow, span) {
  return $('<th colspan="' + span + '">').appendTo(tableHeaderRow);
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

var renderColumnName = function(headerCell, column, cols) {
  var indices = column.indices;
  var thisOffset = findPosition(indices.slice(0));

  var rightIndices = indices.slice(0);
  rightIndices.pop();
  rightIndices.push(thisOffset + 1);

  var leftIndices = indices.slice(0);
  leftIndices.pop();
  leftIndices.push(thisOffset - 1);

  var indicesString = JSON.stringify(indices);
  var buttons_id = 'buttons_' + indices.join('_');
  headerCell.append('<a href="#" onclick="renameColumn(' + indicesString + ');">' + column.name + '</a> ');
  headerCell.append('(<a href="#" onclick="changeMaxWip(' + indicesString + ');">' + column.maxWip + '</a>) ');
  // headerCell.append('[<a href="#" onclick="toggle(\'#' + buttons_id + '\');">?</a>]');
  headerCell.append('<br/>');

  var buttons = $('<div class="buttons btn-group" id="' + buttons_id + '">').appendTo(headerCell);
  if (thisOffset !== 0) {
    buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Left" onclick="swapColumn(' + indicesString + ',' + JSON.stringify(leftIndices) + ');"><i class="fas fa-arrow-left"></i></button>');
  } else {
    buttons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Left"><i class="fas fa-arrow-left"></i></button>');
  }
  buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Add Column"  onclick="addColumn(' + JSON.stringify(rightIndices) + ');"><i class="fas fa-plus"></i></button>');
  if (containerForIndices(indices).columns === undefined) {
    buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Split into Two" onclick="splitColumn(' + indicesString + ');"><i class="fas fa-columns"></i></button>');
  } else {
    buttons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Split into Two"><i class="fas fa-columns"></i></button>');
  }
  buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Delete Column" onclick="delColumn(' + indicesString + ');"><i class="fas fa-trash-alt"></i></button>');
  if (thisOffset < (cols - 1)) {
    buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Right" onclick="swapColumn(' + indicesString + ',' + JSON.stringify(rightIndices) + ');"><i class="fas fa-arrow-right"></i></button>');
  } else {
    buttons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Right"><i class="fas fa-arrow-right"></i></button>');
  }
}

var renderCardColumn = function(tableBodyRow, wip) {
  var tableBodyCell = $('<td>').appendTo(tableBodyRow);
  var cardBoards = $('<div class="column-1">').appendTo(tableBodyCell);
  var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];

  for (var i = 0; i < wip; i++) {
    var randomColour = colours[Math.floor(colours.length * Math.random())];
    cardBoards.append('<div class="card card-' + randomColour + '">');
  }
}

var renderAdsenseCardColumn = function(tableBodyRow) {
  var tableBodyCell = $('<td>').appendTo(tableBodyRow);
  tableBodyCell.append('<div class="column-1" id="adsense">');
}

var save = function(board) {
  $.ajax({
    type: "PUT",
    url: lambdaUrl + "?board=" + board.id,
    data: JSON.stringify(board),
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
    window.board = data;
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
      data: JSON.stringify(window.board),
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

$(document).keypress(function(e) {
  if (e.which === 46) {
    if ($('.buttons').css('display') === 'inline-flex') {
      $('.buttons').css('display', 'none');
    } else {
      $('.buttons').css('display', 'inline-flex');
    }
  }
});
