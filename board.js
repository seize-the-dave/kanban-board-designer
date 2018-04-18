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
  return {name: "New Column", maxWip: 1};
}

var addColumn = function(indices) {
  var container = containerForIndices(indices.slice(0, -1));
  container.columns.splice(indices.pop(), 0, newColumn());

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
  var columns = board['board']['columns'];
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

  var tableBody = $('<tbody>').appendTo(table);
  var tableBodyRow = $('<tr>').appendTo(tableBody);
  var lastRow = pivot.pop().length;
  for (var i = 0; i < lastRow - 1; i++) {
    renderCardColumn(tableBodyRow);
  }
  renderAdsenseCardColumn(tableBodyRow);
}

var renderTableHeader = function(tableHeaderRow, span) {
  return $('<th colspan="' + span + '">').appendTo(tableHeaderRow);
}

var findPosition = function(indices) {
  return indices.pop();
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
  headerCell.append('<a href="#" onclick="renameColumn(' + indicesString + ');">' + column.name + '</a> ');
  headerCell.append('(<a href="#" onclick="changeMaxWip(' + indicesString + ');">' + column.maxWip + '</a>)');
  headerCell.append('<br/>');

  var buttons = $('<div class="buttons">').appendTo(headerCell);
  if (thisOffset !== 0) {
      buttons.append('<button alt="Move Left" onclick="swapColumn(' + indicesString + ',' + JSON.stringify(leftIndices) + ');">&lt;</button>');
  }
  buttons.append('<button alt="Add Column to Left" onclick="addColumn(' + indicesString + ');">+</button>');
  buttons.append('<button alt="Delete Column" onclick="delColumn(' + indicesString + ');">-</button>');
  if (containerForIndices(indices).columns === undefined) {
    buttons.append('<button alt="Split into Two" onclick="splitColumn(' + indicesString + ');">||</button>');
  }
  buttons.append('<button alt="Add Column to Right"  onclick="addColumn(' + JSON.stringify(rightIndices) + ');">+</button>');
  if (thisOffset < (cols - 1)) {
      buttons.append('<button alt="Move Right" onclick="swapColumn(' + indicesString + ',' + JSON.stringify(rightIndices) + ');">&gt;</button>');
  }
}

var renderCardColumn = function(tableBodyRow) {
  var tableBodyCell = $('<td>').appendTo(tableBodyRow);
  var cardBoards = $('<div class="column-1">').appendTo(tableBodyCell);
  var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];

  for (var i = 0; i < 3; i++) {
    var randomColour = colours[Math.floor(colours.length * Math.random())];
    cardBoards.append('<div class="card card-' + randomColour + '">');
  }
}

var renderAdsenseCardColumn = function(tableBodyRow) {
  var tableBodyCell = $('<td>').appendTo(tableBodyRow);
  tableBodyCell.append('<div class="column-1" id="adsense">');
  // var cardBoards = $('<div class="board-body column-1">').appendTo(tableBodyCell);
  // var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];
  //
  // for (var i = 0; i < 3; i++) {
  //   var randomColour = colours[Math.floor(colours.length * Math.random())];
  //   cardBoards.append('<div class="card card-' + randomColour + '">');
  // }
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
