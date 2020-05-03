import handler from "../../libs/handler-lib";
import {getUserProfile} from "../../libs/user-profile-lib";

export const main = handler(async (event, context) => {
  return getUserProfile(event.requestContext.identity.cognitoIdentityId);
});
