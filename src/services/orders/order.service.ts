import { Order, Product } from "@/db/schema";
import { OrderRepository, OrderWithProducts } from "./order.repository.js";

export type IOrderService = {
  getWithProducts(orderId: number): Promise<OrderWithProducts | null>;
  addProducts(order: number, products: Product[]): Promise<boolean>;
  create(order: Order): Promise<Order[]>;
};

export class OrderService implements IOrderService {
  private readonly orderRepository: OrderRepository;

  constructor({ orderRepository }: { orderRepository: OrderRepository }) {
    this.orderRepository = orderRepository;
  }

  async create(order: Order): Promise<Order[]> {
    return await this.orderRepository.create(order);
  }

  async getWithProducts(orderId: number): Promise<OrderWithProducts | null> {
    return await this.orderRepository.findWithProducts(orderId);
  }

  async addProducts(orderId: number, products: Product[]): Promise<boolean> {
    return await this.orderRepository.addProducts(orderId, products);
  }
}
