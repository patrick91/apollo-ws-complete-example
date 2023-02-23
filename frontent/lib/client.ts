import { split, HttpLink, ApolloLink, from } from "@apollo/client";
import { getMainDefinition, Observable } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "http://localhost:8000/",
});

const wsLink =
  typeof window !== "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: "ws://localhost:8000/",
        })
      )
    : null;

const myLink = new ApolloLink(
  (operation, forward) =>
    new Observable((observer) => {
      console.log("myLink", operation);

      const sub = forward(operation).subscribe({
        next(value) {
          console.log("myLink", value);
          observer.next(value);
        },
        error(err) {
          console.log("myLink", err);
          // some logic here, maybe based on `operation`
          observer.error(err);
        },
        complete() {
          console.log("myLink", "complete");
          // or some logic here
          observer.complete();
        },
      });
      return () => {
        console.log("myLink", "unsubscribe");
        sub.unsubscribe();
      };
    })
);

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const client = new ApolloClient({
  link: from([myLink, splitLink]),
  cache: new InMemoryCache(),
});
