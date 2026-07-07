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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Grand Total</TableHead>
          <TableHead>Sold By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
              No sales recorded yet.
            </TableCell>
          </TableRow>
        )}
        {sales.map((sale) => (
          <TableRow key={sale._id}>
            <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
            <TableCell className="text-right">{sale.items.length}</TableCell>
            <TableCell className="text-right font-medium">${sale.grandTotal.toFixed(2)}</TableCell>
            <TableCell>{soldByName(sale.soldBy)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
