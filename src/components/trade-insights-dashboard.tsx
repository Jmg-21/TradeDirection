'use client';

import { useState, useMemo, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, FileText, Bot, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiInsightsAction } from '@/app/actions';
import { INITIAL_CORRELATION_DATA, FOREX_PAIRS, SValue, Bias, Correlation, Currency } from '@/lib/constants';
import { calculateT, calculateS, calculateBias } from '@/lib/trade-utils';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

type CorrelationWithCalculations = Correlation & {
  t: number;
  s: SValue;
};

type ForexPairWithBias = {
  pair: string;
  base: Currency;
  quote: Currency;
  bias: Bias;
  sBase: SValue;
  sQuote: SValue;
};

export default function TradeInsightsDashboard() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [correlationData, setCorrelationData] = useState<Correlation[]>(INITIAL_CORRELATION_DATA);
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('');
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showTradePlan, setShowTradePlan] = useState(false);

  const handleCorrelationChange = (id: Currency, field: keyof Omit<Correlation, 'id'>, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numericValue)) return;

    setCorrelationData((prevData) =>
      prevData.map((row) =>
        row.id === id ? { ...row, [field]: numericValue } : row
      )
    );
  };

  const correlationTableData: CorrelationWithCalculations[] = useMemo(() => {
    return correlationData.map((corr) => {
      const t = calculateT(corr.d1, corr['4h'], corr['1h']);
      const s = calculateS(t);
      return { ...corr, t, s };
    });
  }, [correlationData]);

  const hasCorrelationValues = useMemo(() => {
    return correlationTableData.some(c => c.t !== 0);
  }, [correlationTableData]);

  const forexPairsData: ForexPairWithBias[] = useMemo(() => {
    const sValueMap = new Map(correlationTableData.map(c => [c.id, c.s]));
    return FOREX_PAIRS.map(pair => {
      const sBase = sValueMap.get(pair.base) ?? 'Neutral';
      const sQuote = sValueMap.get(pair.quote) ?? 'Neutral';
      const bias = calculateBias(sBase, sQuote);
      return { ...pair, bias, sBase, sQuote };
    });
  }, [correlationTableData]);

  const filteredCurrencies = useMemo(() =>
    correlationTableData.filter(c => c.id.toLowerCase().includes(currencyFilter.toLowerCase())),
    [correlationTableData, currencyFilter]
  );

  const filteredPairs = useMemo(() =>
    forexPairsData.filter(p => p.pair.toLowerCase().includes(pairFilter.toLowerCase())),
    [forexPairsData, pairFilter]
  );
  
  const filteredPairsForAI = useMemo(() =>
    forexPairsData.filter(p => p.bias !== 'NEUTRAL'),
    [forexPairsData]
  );

  const handleGenerateInsights = () => {
    const insightInput = {
      forexPairs: forexPairsData.map(({ pair, bias }) => ({ pair, bias }))
    };
    
    setIsLoadingAi(true);
    setAiInsight(null);

    startTransition(async () => {
      const result = await getAiInsightsAction(insightInput);
      if ('error' in result) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        setAiInsight(result.insights);
      }
      setIsLoadingAi(false);
    });
  };
  
  const getBadgeClass = (value: SValue | Bias) => {
    switch(value) {
      case 'Strong':
      case 'Extreme Strong':
      case 'BUY':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
      case 'Weak':
      case 'Extreme Weak':
      case 'SELL':
        return 'bg-destructive/20 text-destructive-foreground border-destructive/30';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  }

  const handleGenerateTradingPlan = () => {
    if (hasCorrelationValues) {
      setShowTradePlan(true);
    } else {
      toast({
        title: "No Correlation Data",
        description: "Please enter correlation values before generating a trade plan.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">
          Trade Insights
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AI-powered analysis for your Forex trading strategy.
        </p>
      </header>

      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plan">Correlation & Trade Plan</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="mt-6 space-y-8">
           <section id="correlation-index">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h2 className="font-headline text-2xl font-semibold">Correlation Index</h2>
              <Input 
                placeholder="Filter currencies..."
                className="max-w-xs"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index</TableHead>
                      <TableHead>D1</TableHead>
                      <TableHead>4H</TableHead>
                      <TableHead>1H</TableHead>
                      <TableHead className="text-right">T</TableHead>
                      <TableHead className="text-right">S</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurrencies.map((corr) => (
                      <TableRow key={corr.id}>
                        <TableCell className="font-medium">{corr.id}</TableCell>
                        {(['d1', '4h', '1h'] as const).map(field => (
                          <TableCell key={field}>
                            <Input
                              type="number"
                              value={corr[field]}
                              onChange={(e) => handleCorrelationChange(corr.id, field, e.target.value)}
                              className="w-24 h-8"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-mono">{corr.t}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("font-semibold", getBadgeClass(corr.s))}>
                            {corr.s}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleGenerateTradingPlan} disabled={showTradePlan}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Trading Plan
            </Button>
          </div>

          {showTradePlan && hasCorrelationValues && (
            <section id="forex-pairs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="font-headline text-2xl font-semibold">Forex Pairs</h2>
                <Input 
                  placeholder="Filter pairs..."
                  className="max-w-xs"
                  value={pairFilter}
                  onChange={(e) => setPairFilter(e.target.value)}
                />
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pair</TableHead>
                          <TableHead className="text-right">Bias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPairs.map(pair => (
                          <TableRow key={pair.pair}>
                            <TableCell className="font-medium">{pair.pair}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={cn("font-semibold", getBadgeClass(pair.bias))}>
                                {pair.bias}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </section>
          )}
        </TabsContent>
        <TabsContent value="ai" className="mt-6 space-y-6">
          <section id="ai-forex-pairs">
            <h2 className="font-headline text-2xl font-semibold mb-4">Trading Pair Analysis</h2>
            {hasCorrelationValues ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPairsForAI.map(pair => (
                   <Card key={pair.pair} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pair.pair}</span>
                        <Badge variant="outline" className={cn("font-semibold", getBadgeClass(pair.bias))}>
                          {pair.bias}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex flex-col items-center p-2 rounded-md bg-secondary flex-1">
                           <span className="font-bold">{pair.base}</span>
                           <Badge variant="outline" size="sm" className={cn(getBadgeClass(pair.sBase))}>
                            {pair.sBase}
                          </Badge>
                        </div>
                         <ArrowRight className="text-muted-foreground shrink-0" />
                        <div className="flex flex-col items-center p-2 rounded-md bg-secondary flex-1">
                          <span className="font-bold">{pair.quote}</span>
                           <Badge variant="outline" size="sm" className={cn(getBadgeClass(pair.sQuote))}>
                            {pair.sQuote}
                          </Badge>
                        </div>
                      </div>
                       <CardDescription>
                        {pair.bias === 'BUY' && `Bias is BUY because ${pair.base} is strong and ${pair.quote} is weak.`}
                        {pair.bias === 'SELL' && `Bias is SELL because ${pair.base} is weak and ${pair.quote} is strong.`}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-muted-foreground">
                <CardContent>
                  <p>Please provide some correlation data on the first tab to see trading pair analysis.</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Card className="bg-primary/5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Bot className="text-primary" />
                AI Generated Insights
              </CardTitle>
               <Button onClick={handleGenerateInsights} disabled={isPending || isLoadingAi || !hasCorrelationValues}>
                  <Cpu className="mr-2 h-4 w-4" />
                  {isLoadingAi ? 'Generating...' : 'Generate AI Insights'}
                </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAi ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : aiInsight ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-foreground/90">
                  {aiInsight}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Click "Generate AI Insights" to get trading recommendations.</p>
                  {!hasCorrelationValues && <p className="text-sm text-destructive/80 mt-2">Please provide some correlation data first.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
