'use server';
/**
 * @fileOverview Predicts potential inventory shortages based on historical sales data and current inventory levels.
 *
 * - predictInventoryShortage - A function that predicts potential inventory shortages.
 * - PredictInventoryShortageInput - The input type for the predictInventoryShortage function.
 * - PredictInventoryShortageOutput - The return type for the predictInventoryShortage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictInventoryShortageInputSchema = z.object({
  historicalSalesData: z
    .string()
    .describe(
      'Historical sales data, including product ID, date, quantity sold. Must be in a parsable format like CSV or JSON.'
    ),
  currentInventoryLevels: z
    .string()
    .describe(
      'Current inventory levels for each product, including product ID and quantity in stock.  Must be in a parsable format like CSV or JSON.'
    ),
  upcomingSalesEvents: z
    .string()
    .optional()
    .describe(
      'Optional data about upcoming sales events, including product ID, date, and expected sales increase. Must be in a parsable format like CSV or JSON.'
    ),
});

export type PredictInventoryShortageInput = z.infer<
  typeof PredictInventoryShortageInputSchema
>;

const PredictInventoryShortageOutputSchema = z.object({
  predictedShortages: z
    .string()
    .describe(
      'A list of products predicted to be in shortage, including product ID, predicted shortage quantity, and date of expected shortage.  Must be in a parsable format like CSV or JSON.'
    ),
  confidenceLevels: z
    .string()
    .describe(
      'Confidence levels for each predicted shortage, including product ID and confidence percentage.  Must be in a parsable format like CSV or JSON.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for each predicted shortage, including product ID and suggested reorder quantity.  Must be in a parsable format like CSV or JSON.'
    ),
});

export type PredictInventoryShortageOutput = z.infer<
  typeof PredictInventoryShortageOutputSchema
>;

export async function predictInventoryShortage(
  input: PredictInventoryShortageInput
): Promise<PredictInventoryShortageOutput> {
  return predictInventoryShortageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictInventoryShortagePrompt',
  input: {schema: PredictInventoryShortageInputSchema},
  output: {schema: PredictInventoryShortageOutputSchema},
  prompt: `You are an AI assistant helping warehouse managers predict inventory shortages.

  Analyze the provided historical sales data, current inventory levels, and upcoming sales events to identify potential product shortages.

  Historical Sales Data: {{{historicalSalesData}}}
  Current Inventory Levels: {{{currentInventoryLevels}}}
  Upcoming Sales Events: {{{upcomingSalesEvents}}}

  Based on this information, predict which products are likely to be in shortage, the expected shortage quantity, and the date of the expected shortage.

  Also, provide confidence levels for each predicted shortage and recommendations for reordering.
  Return the output in parsable formats like CSV or JSON.
  `,
});

const predictInventoryShortageFlow = ai.defineFlow(
  {
    name: 'predictInventoryShortageFlow',
    inputSchema: PredictInventoryShortageInputSchema,
    outputSchema: PredictInventoryShortageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
