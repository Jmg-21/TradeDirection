
'use server';

import { generateTradeInsights, GenerateTradeInsightsInput } from '@/ai/flows/generate-trade-insights';

export async function getAiInsightsAction(input: GenerateTradeInsightsInput): Promise<{insights: string} | {error: string}> {
    try {
        const result = await generateTradeInsights(input);
        return { insights: result.insights };
    } catch (error) {
        console.error("AI Insight generation failed:", error);
        return { error: "Failed to generate AI insights. Please try again later." };
    }
}
