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
import { getInventoryShortagePrediction } from '@/app/actions'
import { products, sales } from '@/lib/data'
import { type PredictInventoryShortageOutput } from '@/ai/flows/predict-inventory-shortage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function PredictShortageForm() {
  const [open, setOpen] = useState(false)
  const [prediction, setPrediction] = useState<PredictInventoryShortageOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePredict = async () => {
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    const historicalSalesData = JSON.stringify(sales);
    const currentInventoryLevels = JSON.stringify(products.map(p => ({ productId: p.id, quantity: p.stock })));
    
    const result = await getInventoryShortagePrediction({
        historicalSalesData,
        currentInventoryLevels,
        upcomingSalesEvents: 'Black Friday sale next month, expecting 50% sales increase for electronics.',
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
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Bot className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Predict Shortages
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inventory Shortage Prediction</DialogTitle>
          <DialogDescription>
            Use AI to forecast potential product shortages based on historical data.
          </DialogDescription>
        </DialogHeader>
        {!prediction && !isLoading && !error && (
            <div className="flex items-center space-x-2">
                <p>Click the button below to start the AI prediction.</p>
            </div>
        )}
        
        {isLoading && <div className="flex justify-center items-center p-8"><Bot className="h-8 w-8 animate-spin" /> <span className="ml-2">Analyzing data...</span></div>}
        
        {error && <div className="text-destructive p-4 bg-destructive/10 rounded-md">{error}</div>}

        {prediction && (
            <ScrollArea className="max-h-96 p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Prediction Result</h4>
                
                <div className="mb-4">
                    <h5 className="font-medium text-sm">Predicted Shortages</h5>
                    <pre className="text-xs bg-muted p-2 rounded-md mt-1">{prediction.predictedShortages}</pre>
                </div>
                
                <Separator className="my-4" />

                <div className="mb-4">
                    <h5 className="font-medium text-sm">Confidence Levels</h5>
                    <pre className="text-xs bg-muted p-2 rounded-md mt-1">{prediction.confidenceLevels}</pre>
                </div>

                <Separator className="my-4" />
                
                <div>
                    <h5 className="font-medium text-sm">Recommendations</h5>
                     <pre className="text-xs bg-muted p-2 rounded-md mt-1">{prediction.recommendations}</pre>
                </div>
            </ScrollArea>
        )}
        
        <DialogFooter className="sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Close
            </Button>
            <Button type="button" onClick={handlePredict} disabled={isLoading}>
                {isLoading ? 'Predicting...' : 'Run AI Prediction'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
