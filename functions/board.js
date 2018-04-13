exports.handler = function(event, context, callback) {
    var num_columns = 3 + Math.floor(Math.random() * Math.floor(7));
    var columns = new Array();
    for (var i = 0; i < num_columns; i++) {
        columns.push(i);
    }
    callback(null, {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "http://localhost:8000" },
    body: JSON.stringify(
        {
            "columns": columns
        }
    )
    });
}