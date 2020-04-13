import handler from "../../libs/handler-lib";
import {getPool} from "../../libs/pool-lib";
import {getUserProfile, updateUserProfile} from "../../libs/user-profile-lib";
const OpenTok = require('opentok');

export const main = handler(async (event, context) => {
  // Get streaming status
  const streamingStatus = (await getUserProfile(event.requestContext.identity.cognitoIdentityId)).streamingStatus;

  // Get current pool
  const pool = await getPool(event.pathParameters.poolId);

  // Check if pool has OpenTok session
  if (!pool.openTokSessionConfig || !pool.openTokSessionConfig.sessionId) {
    throw new Error("OpenTok session not found in pool: " + pool);
  }

  // Generate OpenTok token
  function generateOpenTokToken() {
    const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
    return opentok.generateToken(pool.openTokSessionConfig.sessionId);
  }
  const openTokToken = generateOpenTokToken();

  await updateUserProfile(event.requestContext.identity.cognitoIdentityId, {
    streaming: streamingStatus.streaming,
    streamId: streamingStatus.streamId,
    openTokToken: openTokToken
  });

  return pool;
});
