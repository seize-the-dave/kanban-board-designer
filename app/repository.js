define(['require', './renderer', './board'], function(require, Renderer, Board) {
  const LAMBDA_URL = "https://euq9lhwui2.execute-api.us-east-1.amazonaws.com/dev/board";

  var Repository = function(renderer) {
    this.renderer = renderer;
  }

  Repository.prototype.save = function(board, callback) {
    $.ajax({
      type: "PUT",
      url: LAMBDA_URL + "?board=" + board.id,
      data: JSON.stringify({"board": board}),
      dataType: 'text',
    }).done(callback(board));
  }

  Repository.prototype.create = function(board, callback) {
    $.ajax({
      type: "POST",
      url: LAMBDA_URL,
      data: JSON.stringify({"board": board}),
      dataType: 'text',
    }).done(function(data, textStatus, jqXHR) {
      var boardId = new URL(jqXHR.getResponseHeader("location"), new URL(window.location)).searchParams.get("board");
      board.id = boardId;

      callback(board, boardId);
    });
  }

  Repository.prototype.fromId = function(boardId, callback) {
    $.ajax({
        type: "GET",
        url: LAMBDA_URL + "?board=" + boardId,
        dataType: 'json',
    }).done(function(data) {
      callback(Board.fromObject(data.board));
    })
  }

  return Repository;
});
