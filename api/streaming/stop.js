import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getUserProfile, updateUserProfile} from "../../libs/user-profile-lib";

const Mux = require('@mux/mux-node');
const {Video} = new Mux(process.env.muxTokenId, process.env.muxTokenSecret);

export const main = handler(async (event, context) => {

  const streamingStatus = (await getUserProfile(event.requestContext.identity.cognitoIdentityId)).streamingStatus;
  if (!streamingStatus.streaming) {
    throw new Error("Streaming is not started.");
  }

  console.log(event);

  let params = {
    TableName: process.env.streamsTableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      streamId: event.pathParameters.id
    }
  };

  let result = await dynamoDb.get(params);
  let stream = result.Item;
  console.log("Stream:", stream);

  if (stream) {
    let muxLiveStream = null;
    if (stream.muxLiveStream?.id) {
      try {
        muxLiveStream = await Video.LiveStreams.signalComplete(stream.muxLiveStream.id);
        console.log("Mux live stream completed:", muxLiveStream);
      } catch (error) {
        console.log("Failed to complete live stream:", error);
        muxLiveStream = null;
      }
    }

    params = {
      TableName: process.env.streamsTableName,
      Key: {
        userId: event.requestContext.identity.cognitoIdentityId,
        streamId: event.pathParameters.id
      },
      UpdateExpression: "SET streaming = :streaming, muxLiveStream = :muxLiveStream, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":streaming": false,
        ":muxLiveStream": muxLiveStream,
        ":updatedAt": Date.now()
      },
      ReturnValues: "ALL_NEW"
    };

    result = await dynamoDb.update(params);
    stream = result.Attributes;
    console.log("Stopped streaming:", stream);
  }

  await updateUserProfile(event.requestContext.identity.cognitoIdentityId, {
    streaming: false,
    streamId: null,
  });

  return stream;
});
