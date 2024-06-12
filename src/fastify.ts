import fastify from "fastify";
import { asValue } from "awilix";
import { awilixPlugin } from "./di/awilix.plugin.js";
import { configureDiContext } from "./di/di.context.js";
import shutdownPlugin from "./shutdown/shutdown.plugin.js";
import { drizzlePlugin } from "./db/drizzle.plugin.js";
import { OrdreController } from "@/controllers/orders/order.controller";

export async function buildFastify() {
  const server = fastify();

  await server.register(awilixPlugin());
  await server.register(drizzlePlugin);
  await server.register(shutdownPlugin);
  await server.register(configureDiContext);
  await server.register(OrdreController);

  server.addHook("onRequest", async (request) => {
    request.diScope.register({
      logger: asValue(request.log),
    });
  });
  return server;
}
