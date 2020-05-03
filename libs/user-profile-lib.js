import dynamoDb from "./dynamodb-lib";
import {websocketPubSub} from "../api/graphql/websockets";
import {STREAMING_STATUS_UPDATED} from "../api/graphql/user";

export async function getUserProfile(userId) {
  let params = {
    TableName: process.env.userProfilesTableName,
    Key: {
      userId: userId,
    }
  };

  let userProfile = (await dynamoDb.get(params)).Item;
  console.log("User profile:", userProfile);

  if (!userProfile) {
    params = {
      TableName: process.env.userProfilesTableName,
      Item: {
        userId: userId,
        streamingStatus: {
          streaming: false,
          streamId: null,
        },
        updatedAt: Date.now(),
        createdAt: Date.now()
      }
    };
    await dynamoDb.put(params);
    userProfile = params.Item;
    console.log("User profile created:", userProfile);
  }
  return userProfile;
}

export async function updateUserProfile(userId, streamingStatus) {
  const params = {
    TableName: process.env.userProfilesTableName,
    Key: {
      userId: userId,
    },
    UpdateExpression: "SET streamingStatus = :streamingStatus, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":streamingStatus": streamingStatus,
      ":updatedAt": Date.now()
    },
    ReturnValues: "ALL_NEW"
  };

  const userProfile = (await dynamoDb.update(params)).Attributes;
  console.log("Updated user profile:", userProfile);

  await websocketPubSub.publish(STREAMING_STATUS_UPDATED, userProfile);

  return userProfile;
}
