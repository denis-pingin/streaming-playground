import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.streamsTableName,
    KeyConditionExpression: "poolId = :poolId",
    ExpressionAttributeValues: {
      ":poolId": event.pathParameters.poolId
    }
  };

  const result = await dynamoDb.query(params);

  return result.Items;
});
