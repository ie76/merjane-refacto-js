/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
/* eslint-disable max-depth */
/* eslint-disable no-await-in-loop */
import fastifyPlugin from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

export const OrdreController = fastifyPlugin(async (server) => {
  // Add schema validator and serializer
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.withTypeProvider<ZodTypeProvider>().post(
    "/orders/:orderId/processOrder",
    {
      schema: {
        params: z.object({
          orderId: z.coerce.number(),
        }),
      },
    },
    async (request, reply) => {
      const orderService = server.diContainer.resolve("orderService");
      const productService = server.diContainer.resolve("productService");

      const orderId = request.params.orderId;
      const order = await orderService.getWithProducts(orderId);

      /**
       * If the order doesn't exists i will return a 404
       */
      if (!order) {
        reply.code(404).send({ message: "Order not found" });
        return;
      }

      const { products } = order;

      /**
       * If the order contains no products i will return a 404 as well, maybe custom message can be implemented
       */
      if (products.length <= 0) {
        reply.code(404).send({ message: "Order is empty" });
        return;
      }

      for (const product of products) {
        await productService.processOrderProduct(product);
      }
      await reply.send({ orderId: order.id });
    }
  );
});
