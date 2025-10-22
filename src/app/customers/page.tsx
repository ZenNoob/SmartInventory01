import Link from "next/link"
import {
  File,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { customers, getCustomerDebt } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function CustomersPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Customer
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
          <CardDescription>
            Manage customer information and track their debts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Credit Limit</TableHead>
                <TableHead className="text-right">Total Debt</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const debt = getCustomerDebt(customer.id);
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link href={`/customers/${customer.id}`} className="hover:underline">
                        {customer.name}
                      </Link>
                       {customer.isAgent && <Badge variant="secondary" className="ml-2">Agent</Badge>}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatCurrency(customer.creditLimit)}
                    </TableCell>
                    <TableCell className={`text-right ${debt > 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(debt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                             <Link href={`/customers/${customer.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{customers.length}</strong> of <strong>{customers.length}</strong> customers
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
