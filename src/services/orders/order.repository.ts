import { Order, orders, ordersToProducts, Product } from "@/db/schema";
import { Database } from "@/db/type";
import { eq } from "drizzle-orm";

export interface OrderWithProducts extends Required<Order> {
  id: number;
  products: Product[];
}

export interface IOrderRepository {
  findWithProducts(orderId: number): Promise<OrderWithProducts | null>;
  addProducts(order: number, products: Product[]): Promise<boolean>;
  create(order: Order): Promise<Order[]>;
}

export class OrderRepository implements IOrderRepository {
  private readonly db: Database;

  constructor({ db }: { db: Database }) {
    this.db = db;
  }

  /**
   * Create order
   *
   * @param order Order
   * @returns Order[] array
   */
  async create(order: Order): Promise<Order[]> {
    const result = await this.db
      .insert(orders)
      .values(order)
      .returning({ id: orders.id });

    return result;
  }

  /**
   * Add products to order (needs some patched to check if the products exists otherwise it will throw an error)
   *
   * @param orderId int order id
   * @param products Product[] array of products to be added
   * @returns
   */
  async addProducts(orderId: number, products: Product[]): Promise<boolean> {
    const result = await this.db.insert(ordersToProducts).values(
      products.map((product) => ({
        orderId: orderId,
        productId: product.id,
      }))
    );

    return !!result;
  }

  /**
   * return order with it's products
   *
   * @param orderId int order id
   * @returns Promise<OrderWithProducts | null>
   */
  async findWithProducts(orderId: number): Promise<OrderWithProducts | null> {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        products: {
          columns: {},
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const result: OrderWithProducts = {
      id: order.id,
      products: order.products.map((p) => p.product),
    };

    return result;
  }
}
