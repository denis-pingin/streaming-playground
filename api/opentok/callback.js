import * as uuid from "uuid";
import handler from "../../libs/handler-lib";
import dynamoDb from "../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);

  console.log("OpenTok event:", data);

  const params = {
    TableName: process.env.openTokEventsTableName,
    Item: {
      eventId: uuid.v1(),
      eventData: data,
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);

  return {status: true};
});
