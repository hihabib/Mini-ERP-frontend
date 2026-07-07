export interface SaleItem {
  product: string
  productNameSnapshot: string
  quantity: number
  unitPriceSnapshot: number
  subtotal: number
}

export interface SoldBy {
  _id: string
  name: string
  email: string
}

export interface Sale {
  _id: string
  items: SaleItem[]
  grandTotal: number
  soldBy: SoldBy | string
  createdAt: string
}
