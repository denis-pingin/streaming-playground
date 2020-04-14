import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getStream} from "../../libs/stream-lib";
import {sendWebsocketNotification} from "../../libs/websocket-lib";

export const main = handler(async (event, context) => {
  let stream = await getStream(event.pathParameters.poolId, event.pathParameters.streamId);
  if (stream.userId !== event.requestContext.identity.cognitoIdentityId) {
    throw new Error("Permission denied");
  }

  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: event.pathParameters.poolId,
      streamId: event.pathParameters.streamId
    },
    UpdateExpression: "SET openTokStreamId = :openTokStreamId, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":openTokStreamId": data.openTokStreamId || null,
      ":updatedAt": Date.now()
    },
    ReturnValues: "ALL_NEW"
  };

  const result = await dynamoDb.update(params);
  stream = result.Attributes;

  await sendWebsocketNotification(stream.poolId, "streamUpdated", stream);

  return stream;
});
