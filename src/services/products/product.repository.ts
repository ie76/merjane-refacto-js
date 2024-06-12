import { Product, products } from "@/db/schema";
import { Database } from "@/db/type";
import { eq } from "drizzle-orm";

export interface IProductRepository {
  update(product: Product): Promise<Product | null>;
  create(product: Product): Promise<any>;
}

export class ProductRepository implements IProductRepository {
  private readonly db: Database;

  constructor({ db }: { db: Database }) {
    this.db = db;
  }

  async create(product: Product): Promise<any> {
    return this.db.insert(products).values(product);
  }

  async update(product: Product): Promise<any> {
    return this.db
      .update(products)
      .set(product)
      .where(eq(products.id, product.id));
  }
}
