import "reflect-metadata";

import { resolvers } from "./generated/type-graphql";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const main = async () => {
  const schema = await buildSchema({
    resolvers,
    validate: false,
    emitSchemaFile: false,
  });

  //console.log(schema);

  const server = new ApolloServer({
    schema,
    context: () => ({ prisma }),
  });

  // Start the server
  const { url } = await server.listen(4000);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
};

main().catch((err) => {
  console.log(err);
});
