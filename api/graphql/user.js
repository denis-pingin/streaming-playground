import {
  GraphQLBoolean, GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from "graphql";
import {getUserProfile} from "../../libs/user-profile-lib";
import GraphQLLong from "graphql-type-long";
import {withFilter} from "aws-lambda-graphql";
import {websocketPubSub} from "./websockets";

export const StreamingStatusType = new GraphQLObjectType({
  name: "StreamingStatus",
  fields: function () {
    return {
      streaming: {
        type: GraphQLBoolean
      },
      streamId: {
        type: GraphQLString
      },
      openTokToken: {
        type: GraphQLString
      }
    };
  }
});

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: function () {
    return {
      userId: {
        type: GraphQLString
      },
      streamingStatus: {
        type: StreamingStatusType
      },
      createdAt: {
        type: GraphQLLong
      },
      updatedAt: {
        type: GraphQLLong
      }
    };
  }
});

export const UserQueries = {
  profile: {
    type: UserType,
    resolve: (parent, args, context) =>
      getUserProfile(context.event.requestContext.identity.cognitoIdentityId)
  }
};

export const UserMutators = {
};

export const STREAMING_STATUS_UPDATED = 'STREAMING_STATUS_UPDATED';

export const UserSubscriptions = {
  streamingStatusUpdated: {
    type: StreamingStatusType,
    // TODO: Find a way to access userId from the auth context instead using an arg
    args: {
      userId: {
        name: 'userId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (rootValue) => rootValue ? rootValue.streamingStatus : rootValue,
    subscribe: withFilter(
      websocketPubSub.subscribe(STREAMING_STATUS_UPDATED),
      (rootValue, args) => args.userId === rootValue.userId
    )
  }
};