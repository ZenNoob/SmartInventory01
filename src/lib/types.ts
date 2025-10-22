export type Category = {
  id: string
  name: string
}

export type Product = {
  id: string
  name: string
  categoryId: string
  cost: number
  stock: number
}

export type Customer = {
  id: string
  name: string
  email: string
  creditLimit: number
  isAgent?: boolean
}

export type SaleItem = {
  productId: string
  quantity: number
  price: number
}

export type Sale = {
  id: string
  customerId: string
  date: string
  items: SaleItem[]
  total: number
}

export type Payment = {
  id: string
  customerId: string
  date: string
  amount: number
}

export type AppUser = {
  id?: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'accountant' | 'inventory_manager';
}
