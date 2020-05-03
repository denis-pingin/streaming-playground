import {dynamoDbClient} from "../../libs/dynamodb-lib";
import {
  DynamoDBConnectionManager,
  DynamoDBEventProcessor,
  DynamoDBEventStore,
  DynamoDBSubscriptionManager,
  PubSub
} from "aws-lambda-graphql";
import {ApiGatewayManagementApi} from "aws-sdk";

export const websocketEventStore = new DynamoDBEventStore({
  dynamoDbClient,
  eventsTable: process.env.graphqlWebsocketEventsTableName
});

export const websocketPubSub = new PubSub({
  eventStore: websocketEventStore
});

export const websocketEventProcessor = new DynamoDBEventProcessor({
  onError: (error) => console.log(error)
});

export const websocketSubscriptionManager = new DynamoDBSubscriptionManager({
  dynamoDbClient,
  subscriptionsTableName: process.env.graphqlWebsocketSubscriptionsTableName,
  subscriptionOperationsTableName: process.env.graphqlWebsocketSubscriptionOperationsTableName
});
export const websocketConnectionManager = new DynamoDBConnectionManager({
  apiGatewayManager: process.env.IS_OFFLINE
    ? new ApiGatewayManagementApi({
      endpoint: `http://localhost:${process.env.websocketPort}`,
    })
    : undefined,
  dynamoDbClient,
  connectionsTable: process.env.graphqlWebsocketConnectionsTableName,
  subscriptions: websocketSubscriptionManager,
});