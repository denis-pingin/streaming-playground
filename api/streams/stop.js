import handler from "../../libs/handler-lib";
import {stopStreaming} from "../../libs/stream-lib";

export const main = handler(async (event, context) => {
  return stopStreaming(event.requestContext.identity.cognitoIdentityId, event.pathParameters.poolId, event.pathParameters.streamId);
});
