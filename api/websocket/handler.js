import handler from "../../libs/handler-lib";
import {createWebsocketConnection, deleteWebsocketConnection} from "../../libs/websocket-lib";

async function connect(poolId, connectionId, domainName, stage) {
  try {
    await createWebsocketConnection(poolId, connectionId, domainName, stage);
    console.log("Created websocket connection:", poolId, connectionId);
  } catch (err) {
    console.log("Error creating websocket connection:", err);
    return {statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err)};
  }
  return {statusCode: 200, body: 'Connected'};
}

async function disconnect(poolId, connectionId) {
  try {
    await deleteWebsocketConnection(poolId, connectionId);
    console.log("Deleted websocket connection:", poolId, connectionId);
  } catch (err) {
    console.log("Error deleting websocket connection:", err);
    return {statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err)};
  }
  return {statusCode: 200, body: 'Disconnected'};
}

export const main = handler(async (event, context) => {
  console.log(event);
  console.log(context);
  const connectionId = event.requestContext.connectionId;
  const route = event.requestContext.routeKey;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  console.log(connectionId);
  console.log(route);
  console.log(domainName);
  console.log(stage);

  switch (route) {
    case "$connect":
      const poolId = event.queryStringParameters.poolId;
      return connect(poolId, connectionId, domainName, stage);
    case "$disconnect":
      return disconnect(connectionId);
    case "$default":
      console.warn("$default is not mapped");
      return {statusCode: 500, body: "$default is not mapped"};
    default:
      console.warn("Unknown route:", route);
      return {statusCode: 500, body: "Unknown route:" + route};
  }
});
