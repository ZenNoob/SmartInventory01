import type { Product, Category, Customer, Sale, Payment, SalesItem } from '@/lib/types'

// This file contains mock data. It will be removed in a future step.

export const categories: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Clothing' },
  { id: 'cat-3', name: 'Groceries' },
  { id: 'cat-4', name: 'Furniture' },
]

export const products: Product[] = [
  { id: 'prod-1', name: 'Laptop Pro', categoryId: 'cat-1', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-2', name: 'Wireless Mouse', categoryId: 'cat-1', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-3', name: 'Men\'s T-Shirt', categoryId: 'cat-2', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-4', name: 'Organic Apples', categoryId: 'cat-3', purchaseLots: [], status: 'active', unitId: 'kg' },
  { id: 'prod-5', name: 'Wooden Desk', categoryId: 'cat-4', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-6', name: '4K Monitor', categoryId: 'cat-1', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-7', name: 'Jeans', categoryId: 'cat-2', purchaseLots: [], status: 'active', unitId: 'cai' },
  { id: 'prod-8', name: 'Milk (1 Gallon)', categoryId: 'cat-3', purchaseLots: [], status: 'active', unitId: 'cai' },
]

export const sales: Sale[] = [
  { id: 'sale-1', customerId: 'cust-1', transactionDate: '2023-10-01', totalAmount: 1250 },
  { id: 'sale-2', customerId: 'cust-2', transactionDate: '2023-10-05', totalAmount: 175 },
  { id: 'sale-3', customerId: 'cust-1', transactionDate: '2023-10-10', totalAmount: 420 },
  { id: 'sale-4', customerId: 'cust-4', transactionDate: '2023-10-12', totalAmount: 220 }, // Adjusted price for agent
  { id: 'sale-5', customerId: 'cust-3', transactionDate: '2023-11-15', totalAmount: 520 },
  { id: 'sale-6', customerId: 'cust-2', transactionDate: '2023-12-20', totalAmount: 45 },
  { id: 'sale-7', customerId: 'cust-1', transactionDate: '2024-01-05', totalAmount: 50 },
  { id: 'sale-8', customerId: 'cust-2', transactionDate: '2024-02-10', totalAmount: 1300 },
  { id: 'sale-9', customerId: 'cust-3', transactionDate: '2024-03-18', totalAmount: 165 },
  { id: 'sale-10', customerId: 'cust-4', transactionDate: '2024-04-22', totalAmount: 56 },
  { id: 'sale-11', customerId: 'cust-1', transactionDate: '2024-05-01', totalAmount: 150 },
  { id: 'sale-12', customerId: 'cust-2', transactionDate: '2024-05-02', totalAmount: 400 },

]

export const payments: Payment[] = [
  { id: 'pay-1', customerId: 'cust-1', paymentDate: '2023-10-15', amount: 1000 },
  { id: 'pay-2', customerId: 'cust-2', paymentDate: '2023-10-20', amount: 100 },
  { id: 'pay-3', customerId: 'cust-1', paymentDate: '2023-11-01', amount: 670 },
  { id: 'pay-4', customerId: 'cust-4', paymentDate: '2023-11-15', amount: 200 },
  { id: 'pay-5', customerId: 'cust-3', paymentDate: '2023-12-01', amount: 500 },
  { id: 'pay-6', customerId: 'cust-2', paymentDate: '2024-01-15', amount: 75 },
  { id: 'pay-7', customerId: 'cust-2', paymentDate: '2024-05-01', amount: 1200 },
]

export const getCustomerDebt = (customerId: string, salesData: Sale[], paymentsData: Payment[]) => {
  const totalSales = salesData
    .filter(s => s.customerId === customerId)
    .reduce((acc, sale) => acc + sale.totalAmount, 0)
  const totalPayments = paymentsData
    .filter(p => p.customerId === customerId)
    .reduce((acc, payment) => acc + payment.amount, 0)
  return totalSales - totalPayments
}
