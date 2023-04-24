import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

interface RouteConfig<I, O> {
  input: z.ZodSchema<I>;
  handler: ({ input, ctx }: { input: I; ctx: any }) => O;
}

function defineRoute<I, O>(config: RouteConfig<I, O>) {
  return {
    ...config,
  };
}

function defineRouter<T extends Record<string, any>>(routes: T) {
  return routes;
}

function createHandler(router: ReturnType<typeof defineRouter>) {
  return {
    async handleMessage({ WRPC, ctx }: { WRPC: any; ctx: any }) {
      const queryId = WRPC.queryId;
      const route = WRPC.route.split(".");
      const input = WRPC.input;

      // Get the route config
      const routeConfig: ReturnType<typeof defineRoute> = route.reduce(
        (acc: { [x: string]: any }, curr: string) => {
          return acc[curr];
        },
        router
      );

      if (!routeConfig) {
        return {
          WRPC: {
            status: 404,
            queryId,
            message: `Route ${WRPC.route} not found`,
          },
        };
      }

      try {
        const inputSchema = routeConfig.input;
        const handler = routeConfig.handler;
        const parsedInput = inputSchema.parse(input);
        return {
          WRPC: {
            status: 200,
            queryId,
            payload: await handler({ input: parsedInput, ctx }),
          },
        };
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return {
            WRPC: {
              status: 400,
              queryId,
              error: error.issues,
            },
          };
        } else {
          return {
            WRPC: {
              status: 500,
              queryId,
              error,
            },
          };
        }
      }
    },
  };
}

function isWRPCMessage(message: MessageEvent) {
  return message?.data?.WRPC ? true : false;
}

type GenerateRouterPaths<T extends ReturnType<typeof defineRouter>> =
  T extends { [k: string]: any }
    ? {
        [P in keyof T & string]: `${P}${T[P] extends { handler: any }
          ? ""
          : `.${GenerateRouterPaths<T[P]>}`}`;
      }[keyof T & string]
    : never;

// Extracts the input type of a route.
type ExtractRouteInput<Config> = Config extends { input: z.ZodSchema<infer T> }
  ? T
  : never;

// Extracts the output type of a route handler.
type ExtractRouteOutput<Config> = Config extends {
  handler: (...args: any[]) => infer T;
}
  ? T
  : never;

// Looks up the type of a route by its path.
type LookupRoute<T, Path extends string> = Path extends keyof T
  ? T[Path]
  : Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? LookupRoute<T[Key], Rest>
    : never
  : never;

// Extracts the input type of a route by its path.
type RoutePathToRouteInput<Router, Path extends string> = ExtractRouteInput<
  LookupRoute<Router, Path>
>;

// Extracts the output type of a route by its path.
type RouterPathToRouteOutput<Router, Path extends string> = ExtractRouteOutput<
  LookupRoute<Router, Path>
>;

// If the type is not a promise, wrap it in a promise.
type WrapWithPromiseIfNot<T> = T extends Promise<any> ? T : Promise<T>;

// Create the front end client for a given router.
function createClient<Router extends ReturnType<typeof defineRouter>>(
  c: typeof chrome,
) {
  // Convert the above query to a function
  function query<Path extends GenerateRouterPaths<Router>>(
    path: Path,
    input: RoutePathToRouteInput<Router, Path>
  ): WrapWithPromiseIfNot<RouterPathToRouteOutput<Router, Path>> {
    return new Promise((resolve, reject) => {
      const queryId = uuidv4();

      c.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) return
        c.tabs.sendMessage(tabs[0].id, { 
          WRPC: {
            queryId,
            route: path,
            input,
          },
        }, (response) => {
          if (response?.WRPC?.status === 200) {
            resolve(response.WRPC.payload);
          } else {
            reject(response?.WRPC);
          }
        });
      });
    }) as WrapWithPromiseIfNot<RouterPathToRouteOutput<Router, Path>>;
  }

  return {
    query,
  };
}

export { createHandler, createClient, defineRoute, defineRouter, isWRPCMessage };