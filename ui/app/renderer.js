define(['./repository'], function(Repository) {
  const HIDE_SINGLE_SWIMLANES = true;

  var Renderer = function(repository) {
    this.repository = repository;
  }

  Renderer.prototype.render = function(board) {
    $('.tooltip').remove();

    var swimlanes = board.columns;
    var boardWidth = this.calculateSwimlaneWidth(board);
    var boardDepth = this.calculateSwimlaneDepth(board, 0);

    var grid = Array(boardDepth).fill(null).map(x => []);
    this.swimlaneToGrid(board, grid, 0);

    $('#board').empty();
    var table = $('<table>').appendTo('#board');
    var tbody = $('<tbody>').appendTo(table);
    grid.forEach(function(row) {
      var tableRow = $('<tr>').appendTo(tbody);
      row.forEach(function(cell) {
        var payload = cell.payload;
        if (cell.payload.swimlanes !== undefined) {
          tableRow.append(this.renderColumn(cell, board));
        } else if (payload.columns !== undefined) {
          tableRow.append(this.renderSwimlane(cell, board));
        } else {
          tableRow.append(this.renderCards(cell, board));
        }
      }, this);
    }, this);
  }

  Renderer.prototype.renderColumn = function(wrapper, board) {
    var columnHtml = $('<td class="column">');
    var title = wrapper.payload.name;
    var offset = wrapper.parent.columns.indexOf(wrapper.payload);

    if (wrapper.payload.maxWip !== 0) {
      title += ' (' + wrapper.payload.maxWip + ')';
    }
    columnHtml.append(title);
    columnHtml.attr('colspan', wrapper.colspan);
    columnHtml.mouseout(function(e) {
      $(this).find('div.btn-group').css('display', 'none');
    });
    columnHtml.mouseover(function(e) {
      $(this).find('div.btn-group').css('display', 'inline-block');
    });

    var columnButtons = $('<div class="buttons btn-group">');
    columnHtml.append(columnButtons);

    var editButton = this.makeButton('Edit Column', 'fa-edit');
    columnButtons.append(editButton);

    self = this;
    editButton.click(wrapper.payload, function() {
      var modal = $('#columnModal');
      modal.modal('toggle');
      modal.find('.modal-body input#column-name').val(wrapper.payload.name);
      modal.find('.modal-body input#column-wip').val(wrapper.payload.maxWip);

      modal.find('form').submit(function(e) {
        wrapper.payload.name = $('#column-name').val();
        wrapper.payload.maxWip = $('#column-wip').val();
        modal.modal('toggle');

        self.repository.save(board, function(board) {
          self.render(board);
        });

        e.preventDefault();
        modal.find('form').off();
      });
    });

    var addButton = this.makeButton('Add Column', 'fa-plus');
    columnButtons.append(addButton);

    self = this;
    addButton.click(function(e) {
      var column = wrapper.payload.clone();
      column.name = 'New Column';
      wrapper.parent.addAfter(wrapper.payload, column);

      self.repository.save(board, function(board) {
        self.render(board);
      });
    });

    var splitColumnButton = this.makeButton('Split Column', 'fa-columns');
    columnButtons.append(splitColumnButton);
    if (wrapper.payload.swimlanes.length === 1 && wrapper.payload.swimlanes[0].columns.length === 0) {

      self = this;
      splitColumnButton.click(function() {
        wrapper.payload.splitColumn();

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      splitColumnButton.addClass('disabled');
    }

    var splitSwimlaneButton = this.makeButton('Split into Swimlanes', 'fa-bars');
    columnButtons.append(splitSwimlaneButton);
    if (wrapper.payload.swimlanes.length === 1) {
      self = this;
      splitSwimlaneButton.click(function() {
        wrapper.payload.splitSwimlane();

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      splitSwimlaneButton.addClass('disabled');
    }

    var deleteButton = this.makeButton('Delete Column', 'fa-trash-alt');
    columnButtons.append(deleteButton);

    self = this;
    deleteButton.click(function(e) {
      wrapper.parent.removeColumn(wrapper.payload);

      self.repository.save(board, function(board) {
        self.render(board);
      });
    })

    var moveLeftButton = this.makeButton('Move Left', 'fa-arrow-left');
    columnButtons.append(moveLeftButton);
    if (offset > 0) {
      var self = this;
      moveLeftButton.click(function(e) {
        wrapper.parent.moveLeft(wrapper.payload);

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      moveLeftButton.addClass('disabled');
    }

    var moveRightButton = this.makeButton('Move Right', 'fa-arrow-right');
    columnButtons.append(moveRightButton);
    if (offset < wrapper.parent.columns.length - 1) {

      var self = this;
      moveRightButton.click(function(e) {
        wrapper.parent.moveRight(wrapper.payload);

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      moveRightButton.addClass('disabled');
    }

    return columnHtml;
  }

  Renderer.prototype.renderSwimlane = function(wrapper, board) {
    var offset = wrapper.parent.swimlanes.indexOf(wrapper.payload);

    var swimlaneHtml = $('<td class="swimlane">');
    swimlaneHtml.append(wrapper.payload.name);
    swimlaneHtml.attr('colspan', wrapper.colspan);
    swimlaneHtml.mouseout(function(e) {
      $(this).find('div.btn-group').css('display', 'none');
    });
    swimlaneHtml.mouseover(function(e) {
      $(this).find('div.btn-group').css('display', 'inline-block');
    });

    var swimlaneButtons = $('<div class="btn-group buttons">');
    swimlaneHtml.append(swimlaneButtons);

    var editButton = this.makeButton('Edit Swimlane', 'fa-edit');
    swimlaneButtons.append(editButton);

    self = this;
    editButton.click(function(e) {
      var modal = $('#swimlaneModal');
      modal.modal('toggle');
      modal.find('.modal-body input#swimlane-name').val(wrapper.payload.name);
      modal.find('.modal-body input#swimlane-wip').val(wrapper.payload.wip);

      modal.find('form').submit(function(e) {
        wrapper.payload.name = $('#swimlane-name').val();
        wrapper.payload.wip = $('#swimlane-wip').val();
        modal.modal('toggle');

        self.repository.save(board, function(board) {
          self.render(board);
        });

        e.preventDefault();
        modal.find('form').off();
      });
    })

    var addButton = this.makeButton('Add Swimlane', 'fa-plus');
    swimlaneButtons.append(addButton);

    var self = this;
    addButton.click(function(e) {
      var swimlane = wrapper.payload.clone();
      swimlane.name = 'New Swimlane';
      wrapper.parent.addAfter(wrapper.payload, swimlane);

      self.repository.save(board, function(board) {
        self.render(board);
      });
    });

    var deleteButton = this.makeButton('Delete Swimlane', 'fa-trash-alt');
    swimlaneButtons.append(deleteButton);
    if (wrapper.parent.swimlanes.length > 1) {
      deleteButton.click(function(e) {
        wrapper.parent.removeSwimlane(wrapper.payload);

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      deleteButton.addClass('disabled');
    }

    var moveUpButton = this.makeButton('Move Swimlane Up', 'fa-arrow-up');
    swimlaneButtons.append(moveUpButton);
    if (offset !== 0) {
      self = this;
      moveUpButton.click(function(e) {
        wrapper.parent.moveUp(wrapper.payload);

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      moveUpButton.addClass('disabled');
    }

    var moveDownButton = this.makeButton('Move Swimlane Down', 'fa-arrow-down');
    swimlaneButtons.append(moveDownButton);
    if (offset < wrapper.parent.swimlanes.length - 1) {
      self = this;

      moveDownButton.click(function(e) {
        wrapper.parent.moveDown(wrapper.payload);

        self.repository.save(board, function(board) {
          self.render(board);
        });
      });
    } else {
      moveDownButton.addClass('disabled');
    }

    return swimlaneHtml;
  }

  Renderer.prototype.renderCards = function(wrapper) {
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

  Renderer.prototype.makeButton = function(title, icon) {
    return $('<button class="btn btn-primary btn-sm" data-toggle="tooltip" title="' + title + '"><i class="fas ' + icon + '"></i></button>');
  }

  Renderer.prototype.calculateColumnWidth = function(column) {
    var columnWidth = 1;
    column.swimlanes.forEach(function(swimlane) {
      columnWidth = Math.max(columnWidth, this.calculateSwimlaneWidth(swimlane));
    }, this);
    return columnWidth;
  }

  Renderer.prototype.calculateSwimlaneWidth = function(container) {
    var swimlaneWidth = 0;

    container.columns.forEach(function(column) {
      swimlaneWidth += this.calculateColumnWidth(column);
    }, this);

    return swimlaneWidth;
  }

  Renderer.prototype.calculateSwimlaneDepth = function(swimlane) {
    var swimlaneDepth = 0;
    if (swimlane.name !== undefined) {
      swimlaneDepth++;
    }
    if (swimlane.columns.length == 0) {
      return swimlaneDepth + 1;
    } else {
      var columnDepth = 1;
      swimlane.columns.forEach(function(column) {
        columnDepth = Math.max(columnDepth, this.calculateColumnDepth(column));
      }, this);
      swimlaneDepth += columnDepth;
    }

    return swimlaneDepth;
  }

  Renderer.prototype.calculateColumnDepth = function(column) {
    var columnDepth = 1;

    column.swimlanes.forEach(function(swimlane) {
      columnDepth += this.calculateSwimlaneDepth(swimlane);
    }, this);

    // Don't render single swimlanes
    if (HIDE_SINGLE_SWIMLANES && column.swimlanes.length === 1) {
      columnDepth--;
    }

    return columnDepth;
  }

  Renderer.prototype.swimlaneToGrid = function(swimlane, grid, offset, colDepth, colWip) {
    if (swimlane.columns.length > 0) {
      var longestColumn = 1;
      swimlane.columns.forEach(function(column) {
        longestColumn = Math.max(longestColumn, this.calculateColumnDepth(column));
      }, this);
      swimlane.columns.forEach(function(column) {
        var colDepth = (longestColumn - this.calculateColumnDepth(column)) + 1;
        grid[offset].push(this.wrap(column, swimlane, this.calculateColumnWidth(column)));

        this.columnToGrid(column, grid, offset + 1, colDepth);
      }, this);

      return longestColumn;
    } else {
      grid[offset].push(this.wrap({name: 'Cards', wip: colWip}, {}, 1, colDepth));

      return 1;
    }
  }

  Renderer.prototype.columnToGrid = function(column, grid, offset, colDepth) {
    if (HIDE_SINGLE_SWIMLANES && column.swimlanes.length === 1) {
      this.swimlaneToGrid(column.swimlanes[0], grid, offset, colDepth, column.maxWip);
    } else {
      column.swimlanes.forEach(function(swimlane) {
        grid[offset].push(this.wrap(swimlane, column, Math.max(1, this.calculateSwimlaneWidth(swimlane))));
        offset += (this.swimlaneToGrid(swimlane, grid, offset + 1, colDepth, column.maxWip) + 1);
      }, this);
    }
  }

  Renderer.prototype.wrap = function(payload, parent, colspan, rowspan) {
    return {
      payload: payload,
      parent: parent,
      colspan: colspan,
      rowspan: rowspan
    }
  }

  return Renderer;
});
