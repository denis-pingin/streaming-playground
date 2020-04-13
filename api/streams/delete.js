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

  await dynamoDb.delete(params);

  return {status: true};
});
