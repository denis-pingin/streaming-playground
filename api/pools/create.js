import handler from "../../libs/handler-lib";
import {createPool} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  return createPool(event.requestContext.identity.cognitoIdentityId, data.name);
});
