import handler from "../../libs/handler-lib";
import {getStream} from "../../libs/stream-lib";

export const main = handler(async (event, context) => {
  return getStream(event.pathParameters.poolId, event.pathParameters.streamId);
});
