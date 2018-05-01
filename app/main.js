define(['./board', './column', './swimlane', './renderer', './repository'],
  function(Board, Column, Swimlane, Renderer, Repository) {
    var repository = new Repository();
    var renderer = new Renderer(repository);

    $('#board').ready(function(){
      $("body").tooltip({ selector: '[data-toggle=tooltip]' });
      var boardId = new URL(window.location).searchParams.get("board");

      if (boardId == null) {
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

        repository.create(defaultBoard, function(board, boardId) {
          history.pushState({}, "Board", '?board=' + board.id);

          renderer.render(board);
        });
      } else {
        repository.fromId(boardId, function(board) {
          renderer.render(board);
        });
      }
    });
});
