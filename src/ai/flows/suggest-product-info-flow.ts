'use server';
/**
 * @fileOverview An AI agent for suggesting product information.
 *
 * - suggestProductInfo - A function that handles the suggestion process.
 * - SuggestProductInfoInput - The input type for the function.
 * - SuggestProductInfoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductInfoInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  categoryName: z.string().optional().describe('The name of the product\'s category (e.g., "Phân bón lá", "Thuốc trừ sâu").'),
  unitName: z.string().optional().describe('The primary unit of measure for the product (e.g., "Chai", "Gói", "Kg").'),
  avgCost: z.number().optional().describe('The average import cost per base unit of the product.'),
});
export type SuggestProductInfoInput = z.infer<typeof SuggestProductInfoInputSchema>;


const SuggestProductInfoOutputSchema = z.object({
  description: z.string().describe('A compelling, SEO-friendly product description in Vietnamese.'),
  suggestedSellingPrice: z.number().describe('A suggested retail price for the product, taking into account the cost and market standards.'),
});
export type SuggestProductInfoOutput = z.infer<
  typeof SuggestProductInfoOutputSchema
>;

export async function suggestProductInfo(
  input: SuggestProductInfoInput
): Promise<SuggestProductInfoOutput> {
  return suggestProductInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductInfoPrompt',
  input: {schema: SuggestProductInfoInputSchema},
  output: {schema: SuggestProductInfoOutputSchema},
  prompt: `You are an expert business consultant for an agricultural supply store in Vietnam. Your task is to generate a product description and suggest a selling price.

  **IMPORTANT: All output text must be in VIETNAMESE.**

  **Analyze the following product information:**
  - Product Name: {{{productName}}}
  - Category: {{{categoryName}}}
  - Unit: {{{unitName}}}
  - Average Cost: {{{avgCost}}} VND per base unit.

  **Your Task:**
  1.  **Generate Description:**
      - Write a concise, appealing, and informative product description.
      - Highlight key benefits and uses. For example, for a fertilizer, mention its effect on crops (e.g., "giúp cây ra rễ mạnh, đẻ nhánh khỏe"). For a pesticide, mention which pests it targets.
      - Keep it brief, around 2-3 sentences. Do not use bullet points.

  2.  **Suggest Selling Price:**
      - Based on the average cost of {{{avgCost}}} VND, recommend a competitive and profitable retail price ('suggestedSellingPrice').
      - The profit margin should be reasonable for an agricultural supply store, typically between 25% and 50% depending on the product type.
      - Round the final suggested price to a sensible number (e.g., end in 000 or 500).

  **Output Format:**
  Return a JSON object that strictly adheres to the 'SuggestProductInfoOutputSchema'.
  `,
});

const suggestProductInfoFlow = ai.defineFlow(
  {
    name: 'suggestProductInfoFlow',
    inputSchema: SuggestProductInfoInputSchema,
    outputSchema: SuggestProductInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
