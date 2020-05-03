import * as uuid from "uuid";
import dynamoDb from "./dynamodb-lib";
import {deleteStreamByOpenTokStreamId} from "./stream-lib";

const OpenTok = require('opentok');

export async function saveOpenTokEvent(event) {
  const params = {
    TableName: process.env.openTokEventsTableName,
    Item: {
      eventId: uuid.v1(),
      eventData: JSON.stringify(event),
      createdAt: Date.now()
    }
  };

  await dynamoDb.put(params);
  console.log("OpenTok event created:", params.Item);
  return params.Item;
}

export async function handleOpenTokEvent(event) {
  switch (event.event) {
    case "streamCreated":
      console.log("streamCreated:", event.stream.id);
      break;
    case "streamDestroyed":
      console.log("streamDestroyed:", event.stream.id);
      await deleteStreamByOpenTokStreamId(event.stream.id);
      break;
  }
}

export async function startOpenTokSession() {
  const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
  return new Promise((resolve, reject) => {
    opentok.createSession({mediaMode: 'routed'}, function (err, session) {
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

export function generateOpenTokToken(sessionId) {
  const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
  return opentok.generateToken(sessionId);
}
