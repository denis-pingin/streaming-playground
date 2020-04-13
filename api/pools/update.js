import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getPool} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  const pool = await getPool(event.pathParameters.poolId);
  if (pool.ownerUserId !== event.requestContext.identity.cognitoIdentityId) {
    throw new Error("Permission denied");
  }

  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.poolsTableName,
    Key: {
      tenantId: "default",
      poolId: event.pathParameters.poolId
    },
    UpdateExpression: "SET name = :name, updatedAt = : updatedAt",
    ExpressionAttributeValues: {
      ":name": data.name || null,
      ":updatedAt": Date.now()
    },
    ReturnValues: "ALL_NEW"
  };

  const result = await dynamoDb.update(params);
  return result.Attributes;
});
