import handler from "../../libs/handler-lib";
import {createWebsocketConnection, deleteWebsocketConnection} from "../../libs/websocket-lib";
/*
 *  NOT USED
 */
async function connect(userId, connectionId, wsApiGatewayEndpoint) {
  try {
    await createWebsocketConnection(userId, connectionId, wsApiGatewayEndpoint);
    console.log("Created websocket connection:", connectionId);
  } catch (err) {
    console.log("Error creating websocket connection:", err);
    return {statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err)};
  }
  return {statusCode: 200, body: 'Connected'};
}

async function disconnect(connectionId) {
  // try {
  //   await deleteWebsocketConnection(?, connectionId);
  //   console.log("Deleted websocket connection:", poolId, connectionId);
  // } catch (err) {
  //   console.log("Error deleting websocket connection:", err);
  //   return {statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err)};
  // }
  // return {statusCode: 200, body: 'Disconnected'};
}

async function enterPool(poolId, connectionId, wsApiGatewayEndpoint) {
  try {
    await createWebsocketConnection(poolId, connectionId, wsApiGatewayEndpoint);
    console.log("Entered pool:", poolId);
  } catch (err) {
    console.log("Error entering pool:", err);
    return {statusCode: 500, body: 'Error entering pool: ' + JSON.stringify(err)};
  }
  return {statusCode: 200, body: 'Entered pool'};
}

async function exitPool(poolId, connectionId) {
  try {
    await deleteWebsocketConnection(poolId, connectionId);
    console.log("Exited pool:", poolId);
  } catch (err) {
    console.log("Error exiting pool:", err);
    return {statusCode: 500, body: 'Error exiting pool: ' + JSON.stringify(err)};
  }
  return {statusCode: 200, body: 'Exited pool'};
}

export const main = handler(async (event, context) => {
  const route = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;

  let wsApiGatewayEndpoint = "http://localhost:4001";
  if (!process.env.IS_OFFLINE) {
    wsApiGatewayEndpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  }
  console.log("Websocket API Gateway endpoint:", wsApiGatewayEndpoint);

  switch (route) {
    case "$connect":
      const userId = event.queryStringParameters.userId;
      console.log("UserId:", userId);
      if (!userId) {
        return {statusCode: 500, body: "Query string parameter userId required"};
      }
      return connect(userId, connectionId, wsApiGatewayEndpoint);
    case "$disconnect":
      return disconnect(connectionId);
    case "enterPool":
      const enterPoolMessage = JSON.parse(event.body);
      console.log("Enter pool message:", enterPoolMessage);
      return enterPool(enterPoolMessage.data.poolId, connectionId, wsApiGatewayEndpoint);
    case "exitPool":
      const exitPoolMessage = JSON.parse(event.body);
      console.log("Exit pool message:", exitPoolMessage);
      return exitPool(exitPoolMessage.data.poolId, connectionId);
    default:
      console.warn("Unknown route:", route);
      return {statusCode: 500, body: "Unknown route:" + route};
  }
});
