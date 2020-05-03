import handler from "../../libs/handler-lib";
import {deletePool} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  return deletePool(event.requestContext.identity.cognitoIdentityId, event.pathParameters.poolId);
});
