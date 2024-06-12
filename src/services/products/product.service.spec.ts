import { describe, it, expect, beforeEach } from "vitest";
import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { ProductService } from "./product.service.js";
import { Product } from "@/db/schema";
import { INotificationService } from "@/services/notifications/notifications.port";
import { ProductRepository } from "@/services/products/product.repository";
import { ProductType } from "./product.enum.js";

describe("ProductService", () => {
  let productService: ProductService;
  let notificationServiceMock: DeepMockProxy<INotificationService>;
  let productRepositoryMock: DeepMockProxy<ProductRepository>;

  beforeEach(async () => {
    notificationServiceMock = mockDeep<INotificationService>();
    productRepositoryMock = mockDeep<ProductRepository>();

    productService = new ProductService({
      ns: notificationServiceMock,
      productRepository: productRepositoryMock,
    });
  });

  it("should handle normal product when available", async () => {
    const product: Product = {
      id: 1,
      type: ProductType.NORMAL,
      name: "Product 1",
      available: 1,
      leadTime: 0,
      expiryDate: null,
      seasonStartDate: null,
      seasonEndDate: null,
      flashSaleStartDate: null,
      flashSaleEndDate: null,
      maxQuantity: 0,
    };

    await productService.processOrderProduct(product);

    expect(productRepositoryMock.update).toHaveBeenCalledWith(product);
  });

  it("should handle normal product with lead time", async () => {
    const product: Product = {
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
    };

    await productService.processOrderProduct(product);

    expect(productRepositoryMock.update).toHaveBeenCalledWith(product);
    expect(notificationServiceMock.sendDelayNotification).toHaveBeenCalledWith(
      product.leadTime,
      product.name
    );
  });

  it("should handle seasonal product when available", async () => {
    const product: Product = {
      id: 1,
      type: ProductType.SEASONAL,
      name: "Product 1",
      available: 1,
      seasonStartDate: new Date(),
      seasonEndDate: new Date(),
      leadTime: 0,
      expiryDate: null,
      flashSaleStartDate: null,
      flashSaleEndDate: null,
      maxQuantity: 0,
    };

    await productService.processOrderProduct(product);

    expect(productRepositoryMock.update).toHaveBeenCalledWith(product);
  });

  it("should handle seasonal product when not available", async () => {
    const currentDate = new Date();
    const d = 1000 * 60 * 60 * 24;

    const product: Product = {
      id: 1,
      name: "Seasonal Product",
      available: 5,
      leadTime: 10, // Lead time in days
      seasonStartDate: new Date(currentDate.getTime() + 15 * d),
      seasonEndDate: new Date(currentDate.getTime() + 20 * d),
      type: ProductType.SEASONAL,
      expiryDate: null,
      flashSaleStartDate: null,
      flashSaleEndDate: null,
      maxQuantity: 0,
    };

    await productService.processOrderProduct(product);

    expect(
      notificationServiceMock.sendOutOfStockNotification
    ).toHaveBeenCalledWith(product.name);
  });

  it("should handle flash sale product within date range and available", async () => {
    const currentDate = new Date();
    const flashSaleStartDate = new Date(currentDate.getTime() - 1000);
    const flashSaleEndDate = new Date(currentDate.getTime() + 1000);

    const product: Product = {
      id: 1,
      type: ProductType.FLASHSALE,
      name: "Product 1",
      available: 1,
      flashSaleStartDate,
      flashSaleEndDate,
      maxQuantity: 2,
      leadTime: 0,
      expiryDate: null,
      seasonStartDate: null,
      seasonEndDate: null,
    };

    await productService.processOrderProduct(product);

    expect(productRepositoryMock.update).toHaveBeenCalledWith(product);
    expect(product.available).toBe(0);
    expect(product.maxQuantity).toBe(1);
  });

  it("should not handle flash sale product when not within date range", async () => {
    const currentDate = new Date();
    const flashSaleStartDate = new Date(currentDate.getTime() + 1000);
    const flashSaleEndDate = new Date(currentDate.getTime() + 2000);

    const product: Product = {
      id: 1,
      type: ProductType.FLASHSALE,
      name: "Product 1",
      available: 1,
      flashSaleStartDate,
      flashSaleEndDate,
      maxQuantity: 2,
      leadTime: 0,
      expiryDate: null,
      seasonStartDate: null,
      seasonEndDate: null,
    };

    await productService.processOrderProduct(product);

    expect(productRepositoryMock.update).not.toHaveBeenCalled();
    expect(product.available).toBe(1);
    expect(product.maxQuantity).toBe(2);
  });
});
