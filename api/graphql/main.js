import {Schema} from "./schema";
import {Server} from "aws-lambda-graphql";
import {websocketConnectionManager, websocketEventProcessor, websocketSubscriptionManager} from "./websockets";

const apolloServerConfig = {
  connectionManager: websocketConnectionManager,
  eventProcessor: websocketEventProcessor,
  subscriptionManager: websocketSubscriptionManager,
  schema: Schema,
  playground: {
    endpoint: process.env.graphqlEndpoint || '/offline/graphql',
    ...(process.env.IS_OFFLINE ? {
      subscriptionEndpoint: `ws://localhost:${process.env.websocketPort}`
    } : {})
  },
  introspection: true,
  // context: ({event, context}) => ({
  //   headers: event.headers,
  //   functionName: context.functionName,
  //   event,
  //   context,
  // }),
};

const server = new Server(apolloServerConfig);

export const handleHttp = server.createHttpHandler({
  cors: {
    origin: '*',
    credentials: true,
  }
});
export const handleWebSocket = server.createWebSocketHandler();
export const handleDynamoDBStream = server.createEventHandler();
