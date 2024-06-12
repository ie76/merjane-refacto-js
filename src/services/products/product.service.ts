import { Product } from "@/db/schema";
import { ProductType } from "./product.enum.js";
import { ProductRepository } from "@/services/products/product.repository";
import { Cradle } from "@fastify/awilix";
import { type INotificationService } from "../notifications/notifications.port.js";

export interface IProductService {
  processOrderProduct(product: Product): Promise<void>;
  create(product: Product): Promise<any>;
}

export class ProductService implements IProductService {
  private readonly ns: INotificationService;
  private readonly productRepository: ProductRepository;

  public constructor({
    ns,
    productRepository,
  }: Pick<Cradle, "ns" | "productRepository">) {
    this.ns = ns;
    this.productRepository = productRepository;
  }

  /**
   * Method that will handle the process of a product
   *
   * @param product Product
   * @returns void
   */
  public async processOrderProduct(product: Product): Promise<void> {
    switch (product.type) {
      case ProductType.NORMAL:
        await this.handleNormalProduct(product);
        break;
      case ProductType.SEASONAL:
        await this.handleSeasonalProduct(product);
        break;
      case ProductType.EXPIRABLE:
        await this.handleExpiredProduct(product);
        break;
      case ProductType.FLASHSALE:
        await this.handleFlashSaleProduct(product);
        break;

      default:
        throw new Error(`Unknown product type: ${product.type}`);
    }
  }

  private async notifyDelay(leadTime: number, product: Product): Promise<void> {
    product.leadTime = leadTime;
    await this.productRepository.update(product);
    this.ns.sendDelayNotification(leadTime, product.name);
  }

  /**
   * Handle normal product
   *
   * @param product Product
   */
  private async handleNormalProduct(product: Product): Promise<void> {
    if (product.available > 0) {
      product.available -= 1;
      await this.productRepository.update(product);
    } else {
      const { leadTime } = product;
      if (leadTime > 0) {
        await this.notifyDelay(leadTime, product);
      }
    }
  }

  /**
   * Handle seasonal product
   *
   * @param product Product
   */
  private async handleSeasonalProduct(product: Product): Promise<void> {
    const currentDate = new Date();
    const d = 1000 * 60 * 60 * 24;

    if (
      new Date(currentDate.getTime() + product.leadTime * d) >
      product.seasonEndDate!
    ) {
      this.ns.sendOutOfStockNotification(product.name);
      product.available = 0;
      await this.productRepository.update(product);
    } else if (product.seasonStartDate! > currentDate) {
      this.ns.sendOutOfStockNotification(product.name);
      await this.productRepository.update(product);
    } else {
      await this.notifyDelay(product.leadTime, product);
    }
  }

  /**
   * Handl Expired product
   *
   * @param product Product
   */
  private async handleExpiredProduct(product: Product): Promise<void> {
    const currentDate = new Date();
    let needToUpdate = false;

    if (product.available > 0 && product.expiryDate! > currentDate) {
      product.available -= 1;
      needToUpdate = true;
    } else {
      if (product.available > 0 && product.expiryDate! > currentDate) {
        product.available -= 1;
        needToUpdate = true;
      } else {
        this.ns.sendExpirationNotification(product.name, product.expiryDate!);
        product.available = 0;
        needToUpdate = true;
      }
    }

    if (needToUpdate) {
      await this.productRepository.update(product);
    }
  }

  /**
   * Handle Flash Sale product
   *
   * @param product Product
   */
  private async handleFlashSaleProduct(product: Product): Promise<void> {
    const currentDate = new Date();
    // Can be handled better than that ..
    if (
      product.flashSaleStartDate &&
      product.flashSaleEndDate &&
      currentDate >= product.flashSaleStartDate &&
      currentDate <= product.flashSaleEndDate &&
      product.available > 0 &&
      product.maxQuantity > 0
    ) {
      product.available -= 1;
      product.maxQuantity -= 1;
      await this.productRepository.update(product);
    }
  }

  /**
   * Create product (needs in tests)
   *
   * @param product Product
   */
  public async create(product: Product): Promise<any> {
    await this.productRepository.create(product);
  }
}
