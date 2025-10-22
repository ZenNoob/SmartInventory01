'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { getDebtRiskPrediction } from '@/app/actions'
import { sales, payments, getCustomerDebt } from '@/lib/data'
import type { Customer } from '@/lib/types'
import { type PredictDebtRiskOutput } from '@/ai/flows/predict-debt-risk'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PredictRiskFormProps {
  customer: Customer;
}

export function PredictRiskForm({ customer }: PredictRiskFormProps) {
  const [open, setOpen] = useState(false)
  const [prediction, setPrediction] = useState<PredictDebtRiskOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePredict = async () => {
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    const customerPayments = payments.filter(p => p.customerId === customer.id);
    const customerSales = sales.filter(s => s.customerId === customer.id);
    
    const result = await getDebtRiskPrediction({
      customerName: customer.name,
      paymentHistory: JSON.stringify(customerPayments),
      creditLimit: customer.creditLimit,
      outstandingBalance: getCustomerDebt(customer.id),
      recentPurchases: JSON.stringify(customerSales.slice(-5)),
    })

    if (result.success && result.data) {
      setPrediction(result.data)
    } else {
      setError(result.error || 'An unknown error occurred.')
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Bot className="mr-2 h-4 w-4" /> Predict Risk
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Debt Risk Prediction for {customer.name}</DialogTitle>
          <DialogDescription>
            AI-powered analysis of repayment risk based on customer data.
          </DialogDescription>
        </DialogHeader>
        
        {!prediction && !isLoading && !error && (
            <div className="flex items-center space-x-2 p-4">
                <p>Click the button below to start the AI prediction.</p>
            </div>
        )}
        
        {isLoading && <div className="flex justify-center items-center p-8"><Bot className="h-8 w-8 animate-spin" /> <span className="ml-2">Analyzing data...</span></div>}
        
        {error && <div className="text-destructive p-4 bg-destructive/10 rounded-md">{error}</div>}

        {prediction && (
            <ScrollArea className="max-h-80 p-4 border rounded-md">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Risk Assessment</h4>
                        <p className="text-sm p-2 bg-muted rounded-md mt-1">{prediction.riskAssessment}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Contributing Factors</h4>
                        <p className="text-sm p-2 bg-muted rounded-md mt-1">{prediction.riskFactors}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Recommendations</h4>
                        <p className="text-sm p-2 bg-muted rounded-md mt-1">{prediction.recommendations}</p>
                    </div>
                </div>
            </ScrollArea>
        )}
        
        <DialogFooter className="sm:justify-between mt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Close
            </Button>
            <Button type="button" onClick={handlePredict} disabled={isLoading}>
                {isLoading ? 'Running...' : 'Run Prediction Again'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
