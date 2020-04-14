import dynamoDb from "./dynamodb-lib";

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