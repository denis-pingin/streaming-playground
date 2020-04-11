import * as uuid from "uuid";
import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getUserProfile, updateUserProfile} from "../../libs/user-profile-lib";

const Mux = require('@mux/mux-node');
const {Video} = new Mux(process.env.muxTokenId, process.env.muxTokenSecret);

export const main = handler(async (event, context) => {

  const createLiveStream = async () => {
    if (!process.env.muxTokenId || !process.env.muxTokenSecret) {
      throw new Error("It looks like you haven't set up your Mux token in the .env file yet.");
    }

    return await Video.LiveStreams.create({
      playback_policy: 'public',
      reconnect_window: 10,
      new_asset_settings: {playback_policy: 'public'}
    });
  };

  const streamingStatus = (await getUserProfile(event.requestContext.identity.cognitoIdentityId)).streamingStatus;
  if (streamingStatus.streaming) {
    throw new Error("Streaming has already been started.");
  }

  const muxLiveStream = await createLiveStream();
  console.log("MUX live stream created:", muxLiveStream);

  const params = {
    TableName: process.env.streamsTableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      streamId: uuid.v1(),
      streaming: true,
      muxLiveStream: muxLiveStream,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);
  const stream = params.Item;
  console.log("Streaming started:", stream);

  await updateUserProfile(event.requestContext.identity.cognitoIdentityId, {
    streaming: true,
    streamId: stream.streamId,
  });

  return stream;
});
