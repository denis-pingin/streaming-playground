import handler from "../../libs/handler-lib";
import {getStreamsByPoolId} from "../../libs/stream-lib";

export const main = handler(async (event, context) => {
  return getStreamsByPoolId(event.pathParameters.poolId);
});
