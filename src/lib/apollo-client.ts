"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

let client: ApolloClient<unknown> | undefined;

export function getApolloClient() {
  if (client) return client;
  client = new ApolloClient({
    link: new HttpLink({
      uri: "/api/graphql",
      credentials: "same-origin",
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
  return client;
}
