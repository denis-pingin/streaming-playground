import handler from "../../libs/handler-lib";
import {startStreaming} from "../../libs/stream-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  return startStreaming(event.requestContext.identity.cognitoIdentityId, event.pathParameters.poolId, data.name);
});
