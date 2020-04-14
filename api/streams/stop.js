import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getUserProfile, updateUserProfile} from "../../libs/user-profile-lib";
import {sendStreamNotification} from "../../libs/websocket-lib";

export const main = handler(async (event, context) => {

  const streamingStatus = (await getUserProfile(event.requestContext.identity.cognitoIdentityId)).streamingStatus;
  if (!streamingStatus.streaming) {
    throw new Error("Streaming is not started.");
  }

  let params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: event.pathParameters.poolId,
      streamId: event.pathParameters.streamId
    }
  };

  let result = await dynamoDb.get(params);
  let stream = result.Item;
  console.log("Stream:", stream);

  if (stream) {
    const params = {
      TableName: process.env.streamsTableName,
      Key: {
        poolId: event.pathParameters.poolId,
        streamId: event.pathParameters.streamId
      }
    };

    await dynamoDb.delete(params);

    // params = {
    //   TableName: process.env.streamsTableName,
    //   Key: {
    //     poolId: event.pathParameters.poolId,
    //     streamId: event.pathParameters.streamId
    //   },
    //   UpdateExpression: "SET streaming = :streaming, updatedAt = :updatedAt",
    //   ExpressionAttributeValues: {
    //     ":streaming": false,
    //     ":updatedAt": Date.now()
    //   },
    //   ReturnValues: "ALL_NEW"
    // };
    //
    // result = await dynamoDb.update(params);
    // stream = result.Attributes;
    console.log("Stopped streaming:", stream);
  }

  await updateUserProfile(event.requestContext.identity.cognitoIdentityId, {
    streaming: false,
    streamId: null,
    openTokToken: null
  });

  await sendStreamNotification("streamDeleted", {
    poolId: stream.poolId,
    streamId: stream.streamId
  }, event);

  return {status: true};
});
