'use server';

/**
 * @fileOverview AI-powered insight generation for Forex trading pairs.
 *
 * - generateTradeInsights - A function that takes Forex pairs with bias values and returns top 5 trading recommendations with reasoning.
 * - GenerateTradeInsightsInput - The input type for the generateTradeInsights function.
 * - GenerateTradeInsightsOutput - The return type for the generateTradeInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTradeInsightsInputSchema = z.object({
  forexPairs: z.array(
    z.object({
      pair: z.string().describe('The Forex pair (e.g., EURUSD)'),
      bias: z.string().describe('The trading bias for the pair (BUY, SELL, or NEUTRAL)'),
    })
  ).describe('An array of Forex pairs with their associated trading biases.'),
});
export type GenerateTradeInsightsInput = z.infer<typeof GenerateTradeInsightsInputSchema>;

const GenerateTradeInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights recommending the top 5 best pairs to trade and explaining why.'),
});
export type GenerateTradeInsightsOutput = z.infer<typeof GenerateTradeInsightsOutputSchema>;

export async function generateTradeInsights(input: GenerateTradeInsightsInput): Promise<GenerateTradeInsightsOutput> {
  return generateTradeInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTradeInsightsPrompt',
  input: {schema: GenerateTradeInsightsInputSchema},
  output: {schema: GenerateTradeInsightsOutputSchema},
  prompt: `You are an expert Forex trading analyst. Given the following Forex pairs and their trading biases, provide insights recommending the top 5 best pairs to trade and explain your reasoning for each recommendation.\n\nForex Pairs:\n{{#each forexPairs}}\n- Pair: {{this.pair}}, Bias: {{this.bias}}\n{{/each}}\n\nConsider factors such as the strength of the bias, the correlation between the currencies in the pair, and overall market trends when making your recommendations. Format as a numbered list.\n`, 
});

const generateTradeInsightsFlow = ai.defineFlow(
  {
    name: 'generateTradeInsightsFlow',
    inputSchema: GenerateTradeInsightsInputSchema,
    outputSchema: GenerateTradeInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


