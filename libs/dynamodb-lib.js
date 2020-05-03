const dynamodb = require('serverless-dynamodb-client');

export const dynamoDbClient = dynamodb.doc;

export default {
  scan: (params) => dynamoDbClient.scan(params).promise(),
  get: (params) => dynamoDbClient.get(params).promise(),
  put: (params) => dynamoDbClient.put(params).promise(),
  query: (params) => dynamoDbClient.query(params).promise(),
  update: (params) => dynamoDbClient.update(params).promise(),
  delete: (params) => dynamoDbClient.delete(params).promise(),
};
