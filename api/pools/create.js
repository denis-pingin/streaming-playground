import * as uuid from "uuid";
import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

const OpenTok = require('opentok');

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);

  async function startOpenTokSession() {
    const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
    return new Promise((resolve, reject) => {
      opentok.createSession({mediaMode: 'routed', archiveMode: 'always'}, function (err, session) {
        if (err) {
          reject(err);
        }
        resolve({
          apiKey: process.env.openTokApiKey,
          sessionId: session.sessionId
        });
      });
    }).catch(err => {
      throw err;
    });
  }

  const openTokSessionConfig = await startOpenTokSession();
  console.log("OpenTok session config:", openTokSessionConfig);

  const params = {
    TableName: process.env.poolsTableName,
    Item: {
      tenantId: "default",
      poolId: uuid.v1(),
      name: data.name,
      ownerUserId: event.requestContext.identity.cognitoIdentityId,
      openTokSessionConfig: openTokSessionConfig,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);

  return params.Item;
});
