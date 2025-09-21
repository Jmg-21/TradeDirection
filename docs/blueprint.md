# **App Name**: Trade Insights

## Core Features:

- Correlation Index Table: Display an editable table of correlation indexes for EUR, USD, JPY, GBP, NZD, AUD, CAD, and GOLD, including columns for D1, 4H, and 1H editable number fields.
- T Value Calculation: Calculate the T value (= D1 + 4H + 1H) automatically for each index row.
- S Value Logic: Automatically calculate the S value based on the T value. S value will be either 'Neutral', 'Strong', 'Weak', 'Extreme Weak', or 'Extreme Strong' according to pre-defined numerical boundaries.
- Forex Pair Generation: Generate rows of Forex pairs (e.g., EURUSD, EURJPY, etc.) dynamically.
- Bias Generation: Generate a 'Bias' recommendation for each Forex pair row by comparing the 'S' values from the Correlation Index Table for each respective index, utilizing the pre-defined 'S' value strength logic (e.g. Strong vs Weak = BUY).
- AI Insight Generation: After the Forex Pairs table is generated with BIAS values, use AI to generate an overall insight: top 5 best pairs to trade and why. The LLM will act as a tool, performing reasoning to arrive at the recommendations
- Data Filtering: Add filtering functionality to both Correlation Index and Forex Pairs tables for easy data management.
- Trading Plan Generation: Implement a button to trigger trading plan generation.

## Style Guidelines:

- Primary color: Deep Indigo (#667EEA) to convey stability and data-driven insights.
- Background color: Light gray (#F7FAFC), nearly white, to ensure high readability and a clean, modern interface.
- Accent color: Teal (#4FD1C5) for interactive elements and highlights to guide the user's attention.
- Font pairing: 'Space Grotesk' (sans-serif) for headings and 'Inter' (sans-serif) for body text to ensure readability and a modern aesthetic.
- Use simple, line-based icons from a set like 'Feather' to maintain a clean, uncluttered look.
- Employ a grid-based layout with generous white space to maintain organization and readability across data-heavy tables.
- Subtle transitions and animations (e.g., table row expansion, filtering results) to enhance user experience without distraction.