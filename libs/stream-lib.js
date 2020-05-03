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
  if (!result.Item) {
    throw new Error("Stream not found.");
  }

  return result.Item;
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

export async function startStreaming(userId, poolId, name) {
  const pool = await getPool(poolId);
  if (!pool) {
    throw new Error("Pool not found: " + poolId);
  }

  if (!pool.openTokSessionConfig || !pool.openTokSessionConfig.sessionId) {
    throw new Error("OpenTok session not found in pool: " + pool);
  }

  const openTokToken = generateOpenTokToken(pool.openTokSessionConfig.sessionId);

  const params = {
    TableName: process.env.streamsTableName,
    Item: {
      poolId: poolId,
      streamId: uuid.v1(),
      name: name,
      userId: userId,
      streaming: true,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);
  const stream = params.Item;
  stream.openTokToken = openTokToken;
  console.log("Streaming started:", stream);

  await websocketPubSub.publish(STREAMING_STARTED, stream);

  return stream;
}

export async function stopStreaming(userId, poolId, streamId) {
  let params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: poolId,
      streamId: streamId
    }
  };

  let result = await dynamoDb.get(params);
  let stream = result.Item;

  if (stream) {
    const params = {
      TableName: process.env.streamsTableName,
      Key: {
        poolId: poolId,
        streamId: streamId
      }
    };

    await dynamoDb.delete(params);
    console.log("Stopped streaming:", stream);
  }

  await websocketPubSub.publish(STREAMING_STOPPED, stream);

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