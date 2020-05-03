import {GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from "graphql";
import {StreamType} from "./stream.js";
import {getStreamsByPoolId} from "../../libs/stream-lib";
import {createPool, deletePool, getPoolForStreaming, getPools, updatePool} from "../../libs/pool-lib";
import GraphQLLong from "graphql-type-long";
import {websocketPubSub} from "./websockets";

export const OpenTokSessionConfigType = new GraphQLObjectType({
  name: "OpenTokSessionConfig",
  fields: function () {
    return {
      apiKey: {
        type: GraphQLString
      },
      sessionId: {
        type: GraphQLString
      },
      openTokToken: {
        type: GraphQLString
      }
    };
  }
});

export const PoolType = new GraphQLObjectType({
  name: "Pool",
  fields: function () {
    return {
      poolId: {
        type: new GraphQLNonNull(GraphQLString)
      },
      ownerUserId: {
        type: new GraphQLNonNull(GraphQLString)
      },
      name: {
        type: new GraphQLNonNull(GraphQLString)
      },
      streams: {
        type: new GraphQLList(StreamType),
        resolve: (obj) => getStreamsByPoolId(obj.poolId)
      },
      openTokSessionConfig: {
        type: OpenTokSessionConfigType
      },
      createdAt: {
        type: new GraphQLNonNull(GraphQLLong)
      },
      updatedAt: {
        type: new GraphQLNonNull(GraphQLLong)
      }
    };
  }
});

export const PoolQueries = {
  pools: {
    type: new GraphQLList(PoolType),
    resolve: () =>
      getPools()
  },
  pool: {
    args: {
      poolId: {
        name: 'poolId',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: PoolType,
    resolve: (parent, args, context) =>
      getPoolForStreaming(context.event.requestContext.identity.cognitoIdentityId, args.poolId)
  },
};

export const PoolMutators = {
  createPool: {
    args: {
      name: {
        name: "name",
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: PoolType,
    resolve: async (parent, args, context) =>
      createPool(context.event.requestContext.identity.cognitoIdentityId, args.name)
  },
  updatePool: {
    args: {
      poolId: {
        name: "poolId",
        type: new GraphQLNonNull(GraphQLString)
      },
      name: {
        name: "name",
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: PoolType,
    resolve: async (parent, args, context) =>
      updatePool(context.event.requestContext.identity.cognitoIdentityId, args.poolId, args.name)
  },
  deletePool: {
    args: {
      poolId: {
        name: "poolId",
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    type: PoolType,
    resolve: async (parent, args, context) =>
      deletePool(context.event.requestContext.identity.cognitoIdentityId, args.poolId)
  },
};

export const POOL_CREATED = 'POOL_CREATED';
export const POOL_UPDATED = 'POOL_UPDATED';
export const POOL_DELETED = 'POOL_DELETED';

export const PoolSubscriptions = {
  poolCreated: {
    type: PoolType,
    resolve: (rootValue) => rootValue,
    subscribe: websocketPubSub.subscribe(POOL_CREATED),
  },
  poolUpdated: {
    type: PoolType,
    resolve: (rootValue) => rootValue,
    subscribe: websocketPubSub.subscribe(POOL_UPDATED),
  },
  poolDeleted: {
    type: PoolType,
    resolve: (rootValue) => rootValue,
    subscribe: websocketPubSub.subscribe(POOL_DELETED),
  }
};