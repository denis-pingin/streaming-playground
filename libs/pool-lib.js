import dynamoDb from "./dynamodb-lib";

export async function getPool(poolId) {
  let params = {
    TableName: process.env.poolsTableName,
    Key: {
      tenantId: "default",
      poolId: poolId
    }
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Pool not found.");
  }

  return result.Item;
}