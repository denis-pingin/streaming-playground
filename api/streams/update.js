import handler from "../../libs/handler-lib";
import {updateStreamOpenTokStreamId} from "../../libs/stream-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  return updateStreamOpenTokStreamId(
    event.requestContext.identity.cognitoIdentityId,
    event.pathParameters.poolId,
    event.pathParameters.streamId,
    data.openTokStreamId);
});
