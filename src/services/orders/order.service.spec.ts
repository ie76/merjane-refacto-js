import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { OrderService } from "./order.service.js";
import { OrderRepository } from "./order.repository.js";
import { ProductType } from "../products/product.enum.js";

describe("OrderService", () => {
  let orderRepositoryMock: DeepMockProxy<OrderRepository>;
  let orderService: OrderService;

  beforeEach(() => {
    orderRepositoryMock = mockDeep<OrderRepository>();
    orderService = new OrderService({ orderRepository: orderRepositoryMock });
  });

  describe("create", () => {
    it("should call create method of orderRepository", async () => {
      const order = {
        id: 1,
      };

      await orderService.create(order);

      expect(orderRepositoryMock.create).toHaveBeenCalledWith(order);
    });
  });

  describe("getWithProducts", () => {
    it("should call findWithProducts method of orderRepository", async () => {
      const orderId = 1;

      await orderService.getWithProducts(orderId);

      expect(orderRepositoryMock.findWithProducts).toHaveBeenCalledWith(
        orderId
      );
    });

    it("should return the result of findWithProducts method", async () => {
      const orderId = 1;
      const expectedResult = {
        id: 1,
        products: [],
      };
      orderRepositoryMock.findWithProducts.mockResolvedValueOnce(
        expectedResult
      );

      const result = await orderService.getWithProducts(orderId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("addProducts", () => {
    it("should call addProducts method of orderRepository", async () => {
      const orderId = 1;
      const products = [
        {
          id: 1,
          type: ProductType.NORMAL,
          name: "Product 1",
          available: 0,
          leadTime: 2,
          expiryDate: null,
          seasonStartDate: null,
          seasonEndDate: null,
          flashSaleStartDate: null,
          flashSaleEndDate: null,
          maxQuantity: 0,
        },
      ];

      await orderService.addProducts(orderId, products);

      expect(orderRepositoryMock.addProducts).toHaveBeenCalledWith(
        orderId,
        products
      );
    });

    it("should return the result of addProducts method", async () => {
      const orderId = 1;
      const products = [
        {
          id: 1,
          type: ProductType.NORMAL,
          name: "Product 1",
          available: 0,
          leadTime: 2,
          expiryDate: null,
          seasonStartDate: null,
          seasonEndDate: null,
          flashSaleStartDate: null,
          flashSaleEndDate: null,
          maxQuantity: 0,
        },
      ];
      const expectedResult = true;
      orderRepositoryMock.addProducts.mockResolvedValueOnce(expectedResult);

      const result = await orderService.addProducts(orderId, products);

      expect(result).toEqual(expectedResult);
    });
  });
});
