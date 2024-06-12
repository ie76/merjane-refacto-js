import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { type FastifyInstance } from "fastify";
import supertest from "supertest";
import { eq } from "drizzle-orm";
import { type DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { asValue } from "awilix";
import { products, orders, ordersToProducts, Product } from "@/db/schema";
import { type Database } from "@/db/type";
import { buildFastify } from "@/fastify";
import { ProductType } from "@/services/products/product.enum";
import { INotificationService } from "@/services/notifications/notifications.port";
import { OrderService } from "@/services/orders/order.service";
import { ProductService } from "@/services/products/product.service";

describe("OrderController Integration Tests", () => {
  let fastify: FastifyInstance;
  let database: Database;

  let notificationServiceMock: DeepMockProxy<INotificationService>;
  let orderServiceMock: DeepMockProxy<OrderService>;
  let productServiceMock: DeepMockProxy<ProductService>;

  beforeEach(async () => {
    notificationServiceMock = mockDeep<INotificationService>();
    orderServiceMock = mockDeep<OrderService>();
    productServiceMock = mockDeep<ProductService>();

    fastify = await buildFastify();
    fastify.diContainer.register({
      ns: asValue(notificationServiceMock as INotificationService),
      orderService: asValue(orderServiceMock as OrderService),
      productService: asValue(productServiceMock as ProductService),
    });
    await fastify.ready();
    database = fastify.database;
  });
  afterEach(async () => {
    await fastify.close();
  });

  it("should return 404 if order is not found", async () => {
    orderServiceMock.getWithProducts.mockResolvedValue(null);
    const orderId = 123;

    const client = supertest(fastify.server);
    const response = await client.post(`/orders/${orderId}/processOrder`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: "Order not found" });
  });

  it("should return 404 if order is empty", async () => {
    const orderId = 123;
    orderServiceMock.getWithProducts.mockResolvedValue({
      id: orderId,
      products: [],
    });

    const client = supertest(fastify.server);
    const response = await client.post(`/orders/${orderId}/processOrder`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: "Order is empty" });
  });

  it("should process each product in the order", async () => {
    const orderId = 123;
    const products = createProducts();
    orderServiceMock.getWithProducts.mockResolvedValue({
      id: orderId,
      products,
    });

    const client = supertest(fastify.server);
    const response = await client.post(`/orders/${orderId}/processOrder`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ orderId });
    expect(productServiceMock.processOrderProduct).toHaveBeenCalledTimes(
      products.length
    );
    products.forEach((product) => {
      expect(productServiceMock.processOrderProduct).toHaveBeenCalledWith(
        product
      );
    });
  });

  function createProducts(): Product[] {
    const d = 24 * 60 * 60 * 1000;
    return [
      {
        leadTime: 15,
        available: 30,
        type: ProductType.NORMAL,
        name: "USB Cable",
        id: 1,
        expiryDate: null,
        seasonStartDate: null,
        seasonEndDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 10,
        available: 0,
        type: ProductType.NORMAL,
        name: "USB Dongle",
        id: 2,
        expiryDate: null,
        seasonStartDate: null,
        seasonEndDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 15,
        available: 30,
        type: ProductType.EXPIRABLE,
        name: "Butter",
        expiryDate: new Date(Date.now() + 26 * d),
        id: 3,
        seasonStartDate: null,
        seasonEndDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 90,
        available: 6,
        type: ProductType.EXPIRABLE,
        name: "Milk",
        expiryDate: new Date(Date.now() - 2 * d),
        id: 4,
        seasonStartDate: null,
        seasonEndDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 15,
        available: 30,
        type: ProductType.SEASONAL,
        name: "Watermelon",
        seasonStartDate: new Date(Date.now() - 2 * d),
        seasonEndDate: new Date(Date.now() + 58 * d),
        id: 5,
        expiryDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 15,
        available: 30,
        type: ProductType.SEASONAL,
        name: "Grapes",
        seasonStartDate: new Date(Date.now() + 180 * d),
        seasonEndDate: new Date(Date.now() + 240 * d),
        id: 6,
        expiryDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 15,
        available: 30,
        type: ProductType.SEASONAL,
        name: "Grapes",
        seasonStartDate: new Date(Date.now() + 180 * d),
        seasonEndDate: new Date(Date.now() + 240 * d),
        id: 7,
        expiryDate: null,
        flashSaleStartDate: null,
        flashSaleEndDate: null,
        maxQuantity: 0,
      },
      {
        leadTime: 15,
        available: 30,
        type: ProductType.EXPIRABLE,
        maxQuantity: 10,
        flashSaleStartDate: new Date(Date.now() + 180 * d),
        flashSaleEndDate: new Date(Date.now() + 240 * d),
        name: "PS5",
        seasonStartDate: new Date(Date.now() + 180 * d),
        seasonEndDate: new Date(Date.now() + 240 * d),
        id: 8,
        expiryDate: null,
      },
    ];
  }
});
