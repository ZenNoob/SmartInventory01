'use server';

/**
 * @fileOverview This file defines a Genkit flow for predicting the risk of a customer defaulting on their debt.
 *
 * The flow takes customer information as input and returns a risk assessment.
 * @file
 * - predictDebtRisk - A function that initiates the debt risk prediction process.
 * - PredictDebtRiskInput - The input type for the predictDebtRisk function.
 * - PredictDebtRiskOutput - The return type for the predictDebtRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictDebtRiskInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  paymentHistory: z
    .string()
    .describe(
      'A detailed history of the customer payments, including dates, amounts, and any late payments.'
    ),
  creditLimit: z.number().describe('The credit limit assigned to the customer.'),
  outstandingBalance: z
    .number()
    .describe('The current outstanding balance of the customer.'),
  recentPurchases: z
    .string()
    .describe('Details of the customer recent purchases'),
});
export type PredictDebtRiskInput = z.infer<typeof PredictDebtRiskInputSchema>;

const PredictDebtRiskOutputSchema = z.object({
  riskAssessment: z
    .string()
    .describe(
      'An overall risk assessment of the customer defaulting on their debt (e.g., low, medium, high).'
    ),
  riskFactors: z
    .string()
    .describe(
      'A list of factors contributing to the risk assessment, such as late payments or exceeding credit limit.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for managing the risk, such as adjusting credit limits or contacting the customer.'
    ),
});
export type PredictDebtRiskOutput = z.infer<typeof PredictDebtRiskOutputSchema>;

export async function predictDebtRisk(input: PredictDebtRiskInput): Promise<PredictDebtRiskOutput> {
  return predictDebtRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictDebtRiskPrompt',
  input: {schema: PredictDebtRiskInputSchema},
  output: {schema: PredictDebtRiskOutputSchema},
  prompt: `You are an AI assistant specializing in financial risk assessment.

  Analyze the provided customer data to predict the risk of debt default and provide actionable recommendations.

  Customer Name: {{{customerName}}}
  Payment History: {{{paymentHistory}}}
  Credit Limit: {{{creditLimit}}}
  Outstanding Balance: {{{outstandingBalance}}}
  Recent Purchases: {{{recentPurchases}}}

  Based on this information, assess the risk of the customer defaulting on their debt. Identify key risk factors and provide recommendations for mitigating the risk.
  Follow the schema descriptions when generating the output. Make sure to provide output as a JSON object and don't add any other information to the output.
  `,
});

const predictDebtRiskFlow = ai.defineFlow(
  {
    name: 'predictDebtRiskFlow',
    inputSchema: PredictDebtRiskInputSchema,
    outputSchema: PredictDebtRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
