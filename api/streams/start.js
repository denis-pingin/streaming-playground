import * as uuid from "uuid";
import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {updateUserProfile} from "../../libs/user-profile-lib";
import {getPool} from "../../libs/pool-lib";
import {sendWebsocketNotification} from "../../libs/websocket-lib";
const OpenTok = require('opentok');

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);

  const pool = await getPool(event.pathParameters.poolId);
  if (!pool) {
    throw new Error("Pool not found: " + event.pathParameters.poolId);
  }

  if (!pool.openTokSessionConfig || !pool.openTokSessionConfig.sessionId) {
    throw new Error("OpenTok session not found in pool: " + pool);
  }

  function generateOpenTokToken() {
    const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
    return opentok.generateToken(pool.openTokSessionConfig.sessionId);
  }

  const openTokToken = generateOpenTokToken();

  const params = {
    TableName: process.env.streamsTableName,
    Item: {
      poolId: event.pathParameters.poolId,
      streamId: uuid.v1(),
      name: data.name,
      userId: event.requestContext.identity.cognitoIdentityId,
      streaming: true,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);
  const stream = params.Item;
  stream.openTokToken = openTokToken;
  console.log("Streaming started:", stream);

  await updateUserProfile(event.requestContext.identity.cognitoIdentityId, {
    streaming: true,
    streamId: stream.streamId,
    openTokToken: openTokToken
  });

  await sendWebsocketNotification(stream.poolId, "streamCreated", stream);

  return stream;
});
