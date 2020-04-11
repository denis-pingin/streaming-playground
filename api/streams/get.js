import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const params = {
    TableName: process.env.streamsTableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      streamId: event.pathParameters.id
    }
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Stream not found.");
  }

  // Return the retrieved item
  return result.Item;
});
