"use client";

import { ApolloProvider } from "@apollo/client";
import { getApolloClient } from "@/lib/apollo-client";

export function AppApolloProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>;
}
