import { Eye } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { Sale, SoldBy } from '@/types/sale.types'

function soldByName(soldBy: Sale['soldBy']): string {
  if (typeof soldBy === 'object' && soldBy !== null) {
    return (soldBy as SoldBy).name
  }
  return soldBy as string
}

interface SaleHistoryTableProps {
  sales: Sale[]
}

export function SaleHistoryTable({ sales }: SaleHistoryTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  return (
    <>
      <div className="rounded-md border overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="text-right whitespace-nowrap">Items</TableHead>
              <TableHead className="text-right whitespace-nowrap">Grand Total</TableHead>
              <TableHead className="whitespace-nowrap">Sold By</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No sales recorded yet.
                </TableCell>
              </TableRow>
            )}
            {sales.map((sale) => (
              <TableRow
                key={sale._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedSale(sale)}
              >
                <TableCell className="whitespace-nowrap">
                  {new Date(sale.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">{sale.items.length}</TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">
                  ${sale.grandTotal.toFixed(2)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{soldByName(sale.soldBy)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View Details"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSale(sale)
                    }}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">View Details</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              {selectedSale && new Date(selectedSale.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 pt-4">
              <div className="rounded-md border overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Product</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Qty</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Price</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {item.productNameSnapshot}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          ${item.unitPriceSnapshot.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          ${item.subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg font-medium">
                <span>Grand Total</span>
                <span className="text-lg">${selectedSale.grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Sold by: {soldByName(selectedSale.soldBy)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
