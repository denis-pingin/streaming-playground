import handler from "../../libs/handler-lib";
import {updatePoolName} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  return updatePoolName(event.requestContext.identity.cognitoIdentityId, event.pathParameters.poolId, data.name);
});
