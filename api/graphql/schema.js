import {GraphQLObjectType, GraphQLSchema} from "graphql";
import {PoolMutators, PoolQueries, PoolSubscriptions, PoolType} from "./pool";
import {StreamMutators, StreamQueries, StreamSubscriptions, StreamType} from "./stream";
import {StreamingStatusType, UserMutators, UserQueries, UserSubscriptions, UserType} from "./user";

export const Schema = new GraphQLSchema({
  types: [
    StreamingStatusType,
    UserType,
    PoolType,
    StreamType
  ],
  subscription: new GraphQLObjectType({
    name: "RootSubscriptionType",
    fields: {
      ...PoolSubscriptions,
      ...StreamSubscriptions,
      ...UserSubscriptions
    }
  }),
  query: new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      ...PoolQueries,
      ...StreamQueries,
      ...UserQueries
    }
  }),
  mutation: new GraphQLObjectType({
    name: "RootMutationType",
    fields:{
      ...PoolMutators,
      ...StreamMutators,
      ...UserMutators
    }
  })
});