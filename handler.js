'use strict';

var AWS = require('aws-sdk');
var uuid = require('uuid');

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.create = (event, context, callback) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = JSON.parse(event.body);
  var id = uuid.v4();
  var Item = {
    id: id,
    board: params.board
  };
  docClient.put({TableName: 'kanbanboarddesigner', Item: Item}, (error) => {
    if (error) {
      callback(error);
    }

    callback(null, {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        Location: '/board?board=' + id
      }
    });
  });
};

module.exports.read = (event, context, callback) => {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: 'kanbanboarddesigner',
    Key: {
      id: event.queryStringParameters.board
    }
  }

  console.info(params);

  docClient.get(params, (error, data) => {
    console.log(data);
    if (error) {
      callback(error);
    }

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data.Item),
    })
  });
};
