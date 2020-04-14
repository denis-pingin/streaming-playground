import dynamoDb from "./dynamodb-lib";
import AWS from "aws-sdk";

export async function createWebsocketConnection(poolId, connectionId, domainName, stage) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    Item: {
      poolId: poolId,
      connectionId: connectionId,
      domainName: domainName,
      stage: stage
    }
  };

  return dynamoDb.put(params);
}

export async function deleteWebsocketConnection(poolId, connectionId) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    Key: {
      poolId: poolId,
      connectionId: connectionId
    }
  };

  return dynamoDb.delete(params);
}

export async function sendStreamNotification(type, stream, event) {
  const params = {
    TableName: process.env.websocketConnectionsTableName,
    KeyConditionExpression: "poolId = :poolId",
    ExpressionAttributeValues: {
      ":poolId": stream.poolId
    }
  };

  let connectionData;
  try {
    connectionData = await dynamoDb.query(params);
  } catch (e) {
    return {statusCode: 500, body: e.stack};
  }
  console.log("Found websocket connections:", connectionData.Items);

  const apiGateways = {};

  const postCalls = connectionData.Items.map(async (data) => {
    const apiGatewayEndpoint = 'https://' + data.domainName + '/' + data.stage;
    let apiGateway = apiGateways[apiGatewayEndpoint];
    if (!apiGateway) {
      apiGateway = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: apiGatewayEndpoint
      });
      apiGateways[apiGatewayEndpoint] = apiGateway;
      console.log("Created API Gateway:", apiGateway);
    }
    console.log("Handling connection:", data.connectionId);
    try {
      await apiGateway.postToConnection({
        ConnectionId: data.connectionId,
        Data: JSON.stringify({
          type: type,
          stream: stream
        })
      }).promise();
    } catch (e) {
      console.log("Connection handling error:", e);
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${data.connectionId}`);
        await deleteWebsocketConnection(stream.poolId, data.connectionId);
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