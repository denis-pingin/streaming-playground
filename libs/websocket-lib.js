import dynamoDb from "./dynamodb-lib";
import AWS from "aws-sdk";
/*
 *  NOT USED
 */
export async function createWebsocketConnection(keyId, connectionId, wsApiGatewayEndpoint) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    Item: {
      keyId: keyId,
      connectionId: connectionId,
      wsApiGatewayEndpoint: wsApiGatewayEndpoint
    }
  };

  return dynamoDb.put(params);
}

export async function deleteWebsocketConnection(keyId, connectionId) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    Key: {
      keyId: keyId,
      connectionId: connectionId
    }
  };

  return dynamoDb.delete(params);
}

function getApiGateway(connection, apiGateways) {
  let apiGateway = apiGateways[connection.wsApiGatewayEndpoint];
  if (!apiGateway) {
    apiGateway = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: connection.wsApiGatewayEndpoint
    });
    apiGateways[connection.wsApiGatewayEndpoint] = apiGateway;
    console.log("Created API Gateway:", connection.wsApiGatewayEndpoint);
  }
  return apiGateway;
}

export async function sendWebsocketNotification(keyId, eventType, eventData) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    KeyConditionExpression: "keyId = :keyId",
    ExpressionAttributeValues: {
      ":keyId": keyId
    }
  };

  let connections;
  try {
    connections = (await dynamoDb.query(params)).Items;
  } catch (e) {
    return {statusCode: 500, body: e.stack};
  }
  console.log("Found websocket connections:", connections);

  const apiGateways = {};
  const postCalls = connections.map(async (connection) => {
    let apiGateway = getApiGateway(connection, apiGateways);
    console.log("Handling connection:", connection.connectionId);
    try {
      await apiGateway.postToConnection({
        ConnectionId: connection.connectionId,
        Data: JSON.stringify({
          type: eventType,
          data: eventData
        })
      }).promise();
    } catch (e) {
      console.log("Connection handling error:", e);
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connection.connectionId}`);
        await deleteWebsocketConnection(keyId, connection.connectionId);
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return {statusCode: 500, body: e.stack};
  }

  return {statusCode: 200, body: 'Data sent.'};
}