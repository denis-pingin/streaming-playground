import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      poolId: event.pathParameters.poolId,
      streamId: event.pathParameters.streamId
    }
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Stream not found.");
  }

  return result.Item;
});
