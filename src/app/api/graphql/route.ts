import { ApolloServer, HeaderMap } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { createContext } from "@/graphql/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
  introspection: true,
});

// Apollo Server must be started once before handling requests.
const startPromise = server.start();

// Minimal adapter from the Web `Request`/`Response` API (Next App Router route
// handlers) to Apollo Server's HTTP interface. We roll our own because the
// official @as-integrations/next does not yet support Next 16.
async function handler(request: Request): Promise<Response> {
  await startPromise;

  const url = new URL(request.url);
  const headers = new HeaderMap();
  request.headers.forEach((value, key) => headers.set(key, value));

  let body: unknown;
  if (request.method === "POST") {
    body = await request.json().catch(() => undefined);
  }

  const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      headers,
      search: url.search,
      body,
    },
    context: () => createContext(request),
  });

  const responseHeaders = new Headers();
  for (const [key, value] of httpGraphQLResponse.headers) {
    responseHeaders.set(key, value);
  }

  if (httpGraphQLResponse.body.kind === "complete") {
    return new Response(httpGraphQLResponse.body.string, {
      status: httpGraphQLResponse.status ?? 200,
      headers: responseHeaders,
    });
  }

  const chunks: string[] = [];
  for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
    chunks.push(chunk);
  }
  return new Response(chunks.join(""), {
    status: httpGraphQLResponse.status ?? 200,
    headers: responseHeaders,
  });
}

export { handler as GET, handler as POST };
