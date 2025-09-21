import TradeInsightsDashboard from "@/components/trade-insights-dashboard";
import packageJson from "../../package.json";

export default function Home() {
  const version = packageJson.version;
  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <TradeInsightsDashboard version={version} />
    </main>
  );
}
