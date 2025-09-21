'use server';

import { generateTradeInsights, GenerateTradeInsightsInput, GenerateTradeInsightsOutput } from '@/ai/flows/generate-trade-insights';

export async function getAiInsightsAction(input: GenerateTradeInsightsInput): Promise<GenerateTradeInsightsOutput | {error: string}> {
    try {
        const result = await generateTradeInsights(input);
        return result;
    } catch (error) {
        console.error("AI Insight generation failed:", error);
        return { error: "Failed to generate AI insights. Please try again later." };
    }
}
