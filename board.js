var lambdaUrl = "https://euq9lhwui2.execute-api.us-east-1.amazonaws.com/dev/board";

var board = {
  "board": {
    "columns": [
      {name: "Backlog", maxWip: 1},
      {name: "Ready", maxWip: 3},
      {name: "Development", maxWip: 5, "columns": [
        {name: "In Progress", maxWip: 3},
        {name: "Done", maxWip: 2},
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
  // var modal = $('#columnModal');
  // modal.find('.modal-body input#column-name').val('New Column');
  // modal.find('.modal-body input#column-wip').val(1);
  // modal.modal('toggle');

  return {name: window.prompt('Column Name', 'New Column'), maxWip: 1};
}

var addColumn = function(indices) {
  var modal = $('#columnModal');
  modal.modal('toggle');
  modal.find('.modal-body input#column-name').val('New Column');
  modal.find('.modal-body input#column-wip').val(1);

  modal.find('form').submit(function(e) {
    var column = {};
    column.name = $('#column-name').val();
    column.maxWip = $('#column-wip').val();
    modal.modal('toggle');

    var container = containerForIndices(indices.slice(0, -1));
    container.columns.splice(indices.pop(), 0, column);
    save(window.board);

    e.preventDefault();
    modal.find('form').off();
  });
}

var editColumn = function(indices) {
  var container = containerForIndices(indices);
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

var addSwimlane = function(offset) {
  var modal = $('#swimlaneModal');
  modal.modal('toggle');
  modal.find('.modal-body input#swimlane-name').val('New Swimlane');
  modal.find('.modal-body input#swimlane-wip').val(2);

  modal.find('form').submit(function(e) {
    var swimlane = {name: 'New Swimlane', wip: 2};
    swimlane.name = $('#swimlane-name').val();
    swimlane.wip = $('#swimlane-wip').val();
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

var splitColumn = function(indices, cols) {
  var container = containerForIndices(indices);

  var modal = $('#columnModal');
  modal.modal('toggle');
  modal.find('.modal-body input#column-name').val('New Column');
  modal.find('.modal-body input#column-wip').val(1);

  modal.find('form').submit(function(e) {
    var column = {};
    column.name = $('#column-name').val();
    column.maxWip = $('#column-wip').val();
    modal.modal('toggle');

    container.columns = [column, column];
    save(window.board);

    e.preventDefault();
    $(this).off(e);
  });
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

var swapSwimlanes = function(from, to) {
  var swimlaneFrom = window.board.board.swimlanes[from];
  var swimlaneTo = window.board.board.swimlanes[to];

  window.board.board.swimlanes[to] = swimlaneFrom;
  window.board.board.swimlanes[from] = swimlaneTo;

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
        var tableHeaderCell = renderTableHeader(tableHeaderRow, column);
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
  $('.tooltip').remove();

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
    var swimlaneCell = $('<th onmouseout="hideButtons(\'#swimlane_' + i + '\')" onmouseover="showButtons(\'#swimlane_' + i + '\')" class="swimlane" colspan="' + lastRow + '">').appendTo(swimlaneRow);
    var swimlaneTitle = $('<div>' + swimlane.name + '</div>').appendTo(swimlaneCell);
    var swimlaneButtons = $('<div class="btn-group buttons" id="swimlane_' + i + '">').appendTo(swimlaneCell);
    var editModal = $('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Edit Swimlane"><i class="fas fa-edit"></i></button>');
    editModal.click(i, function(e) {
      editSwimlane(e.data);
    })
    swimlaneButtons.append(editModal);
    swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Add Swimlane" onclick="addSwimlane(' + (i + 1) + ')"><i class="fas fa-plus"></i></button></div>');
    if (swimlanes.length > 1) {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Delete Swimlane" onclick="delSwimlane(' + i + ');"><i class="fas fa-trash-alt"></i></button>');
    } else {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Delete Swimlane"><i class="fas fa-trash-alt"></i></button>');
    }
    if (i === 0) {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Swimlane Up"><i class="fas fa-arrow-up"></i></button></div>');
    } else {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Swimlane Up" onclick="swapSwimlanes(' + i + ',' + (i - 1) + ')"><i class="fas fa-arrow-up"></i></button></div>');
    }
    if (i === swimlanes.length - 1) {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Swimlane Down"><i class="fas fa-arrow-down"></i></button></div>');
    } else {
      swimlaneButtons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Swimlane Down" onclick="swapSwimlanes(' + i + ',' + (i + 1) + ')"><i class="fas fa-arrow-down"></i></button></div>');
    }
    var tableBodyRow = $('<tr>').appendTo(tableBody);
    for (var j = 0; j < lastRow; j++) {
      renderCardColumn(tableBodyRow, swimlane.wip);
    }
  }
}

var renderTableHeader = function(tableHeaderRow, column) {
  var tableHeader = $('<th colspan="' + column.span + '">');
  if (column.indices) {
    var id = '#column_' + column.indices.join('_');
    tableHeader.attr('id', id);
    tableHeader.mouseout(id, function(e) {
      hideButtons(e.data);
    });
    tableHeader.mouseover(id, function(e) {
      showButtons(e.data);
    });
  }
  return tableHeader.appendTo(tableHeaderRow);
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

var showButtons = function(id) {
  $(id).css('display', 'inline-block');
}

var hideButtons = function(id) {
  $(id).css('display', 'none');
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
  var buttons_id = 'column_' + indices.join('_');
  var titleDiv = $('<div>').appendTo(headerCell)
  titleDiv.append(column.name + ' (' + column.maxWip + ')');

  var buttons = $('<div class="buttons btn-group" id="' + buttons_id + '">').appendTo(headerCell);
  var editModal = $('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Edit Column"><i class="fas fa-edit"></i></button>');
  editModal.click(indices, function(e) {
    editColumn(e.data);
  })
  buttons.append(editModal);
  // buttons.append('<span data-toggle="modal" data-target="#columnModal" data-column-name="' + column.name + '" data-column-wip="' + column.maxWip + '" data-column-indices="' + indicesString + '"><button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Edit Column"><i class="fas fa-edit"></i></button>');
  buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Add Column"  onclick="addColumn(' + JSON.stringify(rightIndices) + ');"><i class="fas fa-plus"></i></button>');
  if (containerForIndices(indices).columns === undefined) {
    buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Split into Two" onclick="splitColumn(' + indicesString + ', 2);"><i class="fas fa-columns"></i></button>');
  } else {
    buttons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Split into Two"><i class="fas fa-columns"></i></button>');
  }
  buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Delete Column" onclick="delColumn(' + indicesString + ');"><i class="fas fa-trash-alt"></i></button>');
  if (thisOffset !== 0) {
    buttons.append('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="Move Left" onclick="swapColumn(' + indicesString + ',' + JSON.stringify(leftIndices) + ');"><i class="fas fa-arrow-left"></i></button>');
  } else {
    buttons.append('<button class="btn btn-primary btn-sm disabled" data-toggle="tooltip" title="Move Left"><i class="fas fa-arrow-left"></i></button>');
  }
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
