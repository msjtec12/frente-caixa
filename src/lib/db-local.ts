import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  barcode: string | null;
  internalCode: string | null;
  sellPrice: number;
  stock: number;
  unit: string;
  categoryId: string;
  imageUrl: string | null;
  category: { id: string, name: string } | null;
}

export interface LocalCategory {
  id: string;
  name: string;
}

export interface OfflineSale {
  id: string; // uuid temporário
  cashRegisterId: string;
  createdAt: string;
  discount: number;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  payments: {
    method: string;
    amount: number;
  }[];
}

export class PDVDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  categories!: Table<LocalCategory, string>;
  offline_sales!: Table<OfflineSale, string>;

  constructor() {
    super('PDVDatabase');
    // Version 1 definition
    this.version(1).stores({
      products: 'id, categoryId, name, barcode, internalCode', 
      categories: 'id',
      offline_sales: 'id, createdAt' 
    });
  }
}

export const dbLocal = new PDVDatabase();
