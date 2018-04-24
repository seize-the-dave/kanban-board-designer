var lambdaUrl = "https://euq9lhwui2.execute-api.us-east-1.amazonaws.com/dev/board";

var board = {
  "board": {
    "swimlanes": [
      {
        name: "Expedite",
        wip: 1,
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
      },
      {
        name: "Standard",
        wip: 4,
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
      }
    ]
  }
};
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
    console.log(container);
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

var calculateWidth = function(container) {
  var width = 0;
  if (container.swimlanes !== undefined) {
    for (var i = 0; i < container.swimlanes.length; i++) {
      width = Math.max(width, calculateWidth(container.swimlanes[i]));
    }
  } else {
    if (container.columns === undefined) {
      return 1;
    } else {
      for (var i = 0; i < container.columns.length; i++) {
        width += calculateWidth(container.columns[i]);
      }
    }
  }
  return width;
}

var render = function(board) {
  $('.tooltip').remove();
  $('#board').empty();

  var table = $('<table>').appendTo('#board');

  var swimlanes = board.board.swimlanes;
  var boardWidth = calculateWidth(board.board);

  for (var i = 0; i < swimlanes.length; i++) {
    var swimlane = swimlanes[i];
    var augmentedBoard = Object.assign(board.board.swimlanes[i], {});
    augment(augmentedBoard, []);

    var depth = findDepth(augmentedBoard);
    var pivot = Array(depth).fill(null).map(x => []);
    fillIn(pivot, augmentedBoard.columns, 0);

    var swimlaneWidth = calculateWidth(swimlane);
    var widthDifference = boardWidth - swimlaneWidth;
    if (widthDifference > 0) {
      // Need to increase the width of the last columns
      console.log(widthDifference);
      for (var j = 0; j < pivot.length; j++) {
        var row = pivot[j];
        var column = row[row.length - 1];
        column.span += widthDifference;
      }
    }

    var lastRow = pivot[pivot.length - 1].length;

    var swimlaneHead = $('<thead>').appendTo(table);
    var swimlaneRow = $('<tr>').appendTo(swimlaneHead);
    var swimlaneCell = $('<th class="swimlane" colspan="' + boardWidth + '">');
    swimlaneCell.mouseout(function(e) {
      hideButtons($(this));
    });
    swimlaneCell.mouseover(function(e) {
      showButtons($(this));
    });
    swimlaneRow.append(swimlaneCell);

    var swimlaneButtons = $('<div class="btn-group buttons" id="swimlane_' + i + '">');
    var editButton = makeButton('Edit Swimlane', 'fa-edit');
    editButton.click(i, function(e) {
      editSwimlane(e.data);
    })
    swimlaneButtons.append(editButton);

    var addButton = makeButton('Add Swimlane', 'fa-plus');
    addButton.click([i + 1, swimlane.columns], function(e) {
      addSwimlane(e.data[0], e.data[1]);
    });
    swimlaneButtons.append(addButton);

    var deleteButton = makeButton('Delete Swimlane', 'fa-trash-alt');
    if (swimlanes.length > 1) {
      deleteButton.click(i, function(e) {
        delSwimlane(e.data);
      })
    } else {
      deleteButton.attr('disabled', 'disabled');
    }
    swimlaneButtons.append(deleteButton);

    var moveUpButton = makeButton('Move Swimlane Up', 'fa-arrow-up');
    if (i !== 0) {
      moveUpButton.click(i, function(e) {
        swapSwimlanes(e.data, e.data - 1);
      })
    } else {
      moveUpButton.attr('disabled', 'disabled');
    }
    swimlaneButtons.append(moveUpButton);

    var moveDownButton = makeButton('Move Swimlane Down', 'fa-arrow-down');
    if (i < swimlanes.length - 1) {
      moveDownButton.click(i, function(e) {
        swapSwimlanes(e.data, e.data + 1);
      });
    } else {
      moveDownButton.attr('disabled', 'disabled');
    }
    swimlaneButtons.append(moveDownButton);

    var swimlaneTitle = $('<div>' + swimlane.name + '</div>').appendTo(swimlaneCell);
    swimlaneTitle.appendTo(swimlaneCell);
    swimlaneButtons.appendTo(swimlaneCell);

    var columnHeadSection = $('<thead>').appendTo(table);
    makeColumnHeaders(columnHeadSection, pivot, swimlane);

    var cardSection = $('<tbody>').appendTo(table);
    var cardRow = $('<tr>').appendTo(cardSection);

    for (var j = 0; j < swimlaneWidth; j++) {
      var span = 1;
      if (widthDifference > 0 && j == swimlaneWidth - 1) {
        span += widthDifference;
      }
      cardRow.append(makeCardColumn(swimlane.wip, span));
    }
  }
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
  var tableBodyCell = $('<td colspan="' + span + '">');
  var cardBoards = $('<div class="column-1">').appendTo(tableBodyCell);
  var colours = ['yellow', 'yellow', 'yellow', 'blue', 'pink', 'orange', 'green'];

  for (var i = 0; i < wip; i++) {
    var randomColour = colours[Math.floor(colours.length * Math.random())];
    cardBoards.append('<div class="card card-' + randomColour + '">');
  }

  return tableBodyCell;
}

var save = function(board) {
  console.log(board);
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
