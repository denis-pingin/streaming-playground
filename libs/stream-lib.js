import dynamoDb from "./dynamodb-lib";
import {getPool} from "./pool-lib";
import * as uuid from "uuid";
import {generateOpenTokToken} from "./opentok-lib";
import {websocketPubSub} from "../api/graphql/websockets";
import {STREAM_UPDATED, STREAMING_STARTED, STREAMING_STOPPED} from "../api/graphql/stream";

export async function getStream(poolId, streamId) {
  let params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: poolId,
      streamId: streamId
    }
  };
  const result = await dynamoDb.get(params);
  return result.Item;
}

async function createStream(userId, poolId, name) {
  const stream = {
    poolId: poolId,
    streamId: uuid.v1(),
    name: name,
    userId: userId,
    streaming: true,
    updatedAt: Date.now(),
    createdAt: Date.now()
  };
  const params = {
    TableName: process.env.streamsTableName,
    Item: stream
  };

  await dynamoDb.put(params);
  console.log("Stream created:", stream);
  return stream;
}

export async function getStreamsByPoolId(poolId) {
  const params = {
    TableName: process.env.streamsTableName,
    KeyConditionExpression: "poolId = :poolId",
    ExpressionAttributeValues: {
      ":poolId": poolId
    }
  };

  const result = await dynamoDb.query(params);
  return result.Items;
}

export async function deleteStreamByOpenTokStreamId(openTokStreamId) {
  let params = {
    TableName: process.env.streamsTableName,
    FilterExpression: "openTokStreamId = :openTokStreamId",
    ExpressionAttributeValues: {
      ":openTokStreamId": openTokStreamId
    }
  };
  const result = await dynamoDb.scan(params);
  const streams = result.Items;
  console.log("Found streams for openTokStreamId:", openTokStreamId, streams);

  streams.forEach(stream => {
    deleteStream(stream);
  });
}

async function deleteStream(stream) {
  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: stream.poolId,
      streamId: stream.streamId
    }
  };
  await dynamoDb.delete(params);
  console.log("Deleted stream:", stream);
  await websocketPubSub.publish(STREAMING_STOPPED, stream);
}

export async function startStreaming(userId, poolId, name) {
  const pool = await getPool(poolId);
  if (!pool) {
    throw new Error("Pool not found: " + poolId);
  }

  if (!pool.openTokSessionConfig || !pool.openTokSessionConfig.sessionId) {
    throw new Error("OpenTok session not found in pool: " + pool);
  }

  const openTokToken = generateOpenTokToken(pool.openTokSessionConfig.sessionId);

  const stream = await createStream(userId, poolId, name);
  stream.openTokToken = openTokToken;

  await websocketPubSub.publish(STREAMING_STARTED, stream);

  return stream;
}

export async function stopStreaming(userId, poolId, streamId) {
  console.log("Stopping streaming:", userId, poolId, streamId);
  const stream = await getStream(poolId, streamId);
  console.log("Stream:", stream);
  if (stream.userId !== userId) {
    throw new Error("Permission denied");
  }
  if (stream) {
    await deleteStream(stream);
  }
  return stream;
}

export async function updateStreamOpenTokStreamId(userId, poolId, streamId, openTokStreamId) {
  let stream = await getStream(poolId, streamId);
  if (stream.userId !== userId) {
    throw new Error("Permission denied");
  }

  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: poolId,
      streamId: streamId
    },
    UpdateExpression: "SET openTokStreamId = :openTokStreamId, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":openTokStreamId": openTokStreamId || null,
      ":updatedAt": Date.now()
    },
    ReturnValues: "ALL_NEW"
  };

  const result = await dynamoDb.update(params);
  stream = result.Attributes;

  await websocketPubSub.publish(STREAM_UPDATED, stream);

  return stream;
}

export async function updateStreamName(poolId, streamId, name) {
  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: poolId,
      streamId: streamId
    },
    UpdateExpression: "SET name = :name, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":name": name || null,
      ":updatedAt": Date.now()
    },
    ReturnValues: "ALL_NEW"
  };

  const result = await dynamoDb.update(params);
  const stream = result.Attributes;

  await websocketPubSub.publish(STREAM_UPDATED, stream);

  return stream;
}