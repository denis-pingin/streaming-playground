import {GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from "graphql";
import {getPool} from "../../libs/pool-lib";
import {PoolType} from "./pool";
import {
  getStream,
  getStreamsByPoolId,
  startStreaming,
  stopStreaming,
  updateStreamName,
  updateStreamOpenTokStreamId
} from "../../libs/stream-lib";
import GraphQLLong from 'graphql-type-long';
import {websocketPubSub} from "./websockets";
import {withFilter} from "aws-lambda-graphql";

export const StreamType = new GraphQLObjectType({
  name: "Stream",
  fields: function () {
    return {
      poolId: {
        type: new GraphQLNonNull(GraphQLString)
      },
      streamId: {
        type: new GraphQLNonNull(GraphQLString)
      },
      userId: {
        type: new GraphQLNonNull(GraphQLString)
      },
      openTokStreamId: {
        type: GraphQLString
      },
      name: {
        type: new GraphQLNonNull(GraphQLString)
      },
      pool: {
        type: PoolType,
        resolve: (obj) => getPool(obj.poolId)
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

export const StreamQueries = {
  streams: {
    args: {
      poolId: {
        name: 'poolId',
        type: GraphQLString
      }
    },
    type: new GraphQLList(StreamType),
    resolve: (parent, args) =>
      getStreamsByPoolId(args.poolId)
  },
  stream: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      },
      streamId: {
        name: 'streamId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: StreamType,
    resolve: (parent, args) =>
      getStream(args.poolId, args.streamId)
  },
};

export const StreamMutators = {
  startStreaming: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      },
      name: {
        name: 'name',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: StreamType,
    resolve: async (parent, args, context) =>
      startStreaming(context.event.requestContext.identity.cognitoIdentityId, args.poolId, args.name)
  },
  stopStreaming: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      },
      streamId: {
        name: 'streamId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: StreamType,
    resolve: async (parent, args, context) =>
      stopStreaming(context.event.requestContext.identity.cognitoIdentityId, args.poolId, args.streamId)
  },
  updateStreamOpenTokStreamId: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      },
      streamId: {
        name: 'streamId',
        type: new GraphQLNonNull(GraphQLString)
      },
      openTokStreamId: {
        name: 'openTokStreamId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: StreamType,
    resolve: async (parent, args, context) =>
      updateStreamOpenTokStreamId(context.event.requestContext.identity.cognitoIdentityId, args.poolId, args.streamId, args.openTokStreamId)
  },
  updateStreamName: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      },
      streamId: {
        name: 'streamId',
        type: new GraphQLNonNull(GraphQLString)
      },
      name: {
        name: 'name',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: StreamType,
    resolve: async (parent, args, context) =>
      updateStreamName(context.event.requestContext.identity.cognitoIdentityId, args.poolId, args.streamId, args.name)
  }
};

export const STREAMING_STARTED = 'STREAMING_STARTED';
export const STREAMING_STOPPED = 'STREAMING_STOPPED';
export const STREAM_UPDATED = 'STREAM_UPDATED';

export const StreamSubscriptions = {
  streamingStarted: {
    type: StreamType,
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (rootValue) => rootValue,
    subscribe: withFilter(
      websocketPubSub.subscribe(STREAMING_STARTED),
      (rootValue, args) => args.poolId === rootValue.poolId
    )
  },
  streamingStopped: {
    type: StreamType,
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (rootValue) => rootValue,
    subscribe: withFilter(
      websocketPubSub.subscribe(STREAMING_STOPPED),
      (rootValue, args) => args.poolId === rootValue.poolId
    )
  },
  streamUpdated: {
    type: StreamType,
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: (rootValue) => rootValue,
    subscribe: withFilter(
      websocketPubSub.subscribe(STREAM_UPDATED),
      (rootValue, args) => args.poolId === rootValue.poolId
    )
  }
};