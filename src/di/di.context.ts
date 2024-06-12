import { type Cradle, diContainer } from "@fastify/awilix";
import { asClass, asValue } from "awilix";
import { type FastifyBaseLogger, type FastifyInstance } from "fastify";
// import { type INotificationService } from "@/services/notifications.port";
import { type Database } from "@/db/type";
import { OrderService } from "@/services/orders/order.service";
import { OrderRepository } from "@/services/orders/order.repository";
import { ProductRepository } from "@/services/products/product.repository";
import { type INotificationService } from "@/services/notifications/notifications.port";
import { ProductService } from "@/services/products/product.service";
import { NotificationService } from "@/services/notifications/notification.service";

declare module "@fastify/awilix" {
  interface Cradle {
    // eslint-disable-line @typescript-eslint/consistent-type-definitions
    logger: FastifyBaseLogger;
    db: Database;
    ns: INotificationService;
    // Add order
    orderService: OrderService;
    orderRepository: OrderRepository;
    // add product
    productService: ProductService;
    productRepository: ProductRepository;
  }
}

export async function configureDiContext(
  server: FastifyInstance
): Promise<void> {
  diContainer.register({
    logger: asValue(server.log),
    db: asValue(server.database),
    ns: asClass(NotificationService),
    // Add order
    orderRepository: asClass(OrderRepository),
    orderService: asClass(OrderService),
    // add product
    productService: asClass(ProductService),
    productRepository: asClass(ProductRepository),
  });
}

export function resolve<Service extends keyof Cradle>(
  service: Service
): Cradle[Service] {
  return diContainer.resolve(service);
}
