import handler from "../../libs/handler-lib";
import {getPoolForStreaming} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  return getPoolForStreaming(event.requestContext.identity.cognitoIdentityId, event.pathParameters.poolId);
});
