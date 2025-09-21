'use server';

/**
 * @fileOverview AI-powered insight generation for Forex trading pairs.
 *
 * - generateTradeInsights - A function that takes Forex pairs with bias values and returns top 6 trading recommendations with reasoning.
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
      confidence: z.number().describe('A numerical value indicating the strength of the signal, derived from the Directions table.'),
    })
  ).describe('An array of Forex pairs with their associated trading biases and confidence scores.'),
});
export type GenerateTradeInsightsInput = z.infer<typeof GenerateTradeInsightsInputSchema>;

const GenerateTradeInsightsOutputSchema = z.object({
  recommendations: z.array(z.object({
    pair: z.string().describe('The forex pair, e.g. EURUSD'),
    action: z.enum(['BUY', 'SELL', 'HOLD']).describe('The recommended action for the pair.'),
    reasoning: z.string().describe('The detailed reasoning for the recommendation.'),
    confidence: z.number().describe('The original confidence score of the recommendation from the input.'),
  })).describe('An array of the top 6 trading recommendations.')
});
export type GenerateTradeInsightsOutput = z.infer<typeof GenerateTradeInsightsOutputSchema>;

export async function generateTradeInsights(input: GenerateTradeInsightsInput): Promise<GenerateTradeInsightsOutput> {
  return generateTradeInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTradeInsightsPrompt',
  input: {schema: GenerateTradeInsightsInputSchema},
  output: {schema: GenerateTradeInsightsOutputSchema},
  prompt: `You are an expert Forex trading analyst. Given the following Forex pairs, their trading biases, and a confidence score from the Directions table, provide insights recommending the top 6 best pairs to trade. For each recommendation, you must specify the pair, the action (BUY, SELL, or HOLD), your reasoning, and return the original confidence score that was provided in the input.

Forex Pairs:
{{#each forexPairs}}
- Pair: {{this.pair}}, Bias: {{this.bias}}, Confidence: {{this.confidence}}
{{/each}}

Consider factors such as the strength of the bias (higher confidence is better), the correlation between the currencies in the pair, and overall market trends when making your recommendations. Prioritize pairs with high confidence scores. 
Additionally, promote diversification in your recommendations by avoiding a concentration on a single currency (e.g., do not suggest only USD-based or EUR-based pairs).
Your output must contain exactly 6 recommendations.
`, 
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
