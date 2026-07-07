export interface SaleItem {
  product: string
  productNameSnapshot: string
  quantity: number
  unitPriceSnapshot: number
  subtotal: number
}

export interface Sale {
  _id: string
  items: SaleItem[]
  grandTotal: number
  soldBy: string
  createdAt: string
}
