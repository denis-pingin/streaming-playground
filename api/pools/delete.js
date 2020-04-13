import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";
import {getPool} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  const pool = await getPool(event.pathParameters.poolId);
  if (pool.ownerUserId !== event.requestContext.identity.cognitoIdentityId) {
    throw new Error("Permission denied");
  }

  const params = {
    TableName: process.env.poolsTableName,
    Key: {
      tenantId: "default",
      poolId: event.pathParameters.poolId
    }
  };

  await dynamoDb.delete(params);

  return {status: true};
});
