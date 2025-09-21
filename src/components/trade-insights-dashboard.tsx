'use client';

import { useState, useMemo, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Bot, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiInsightsAction } from '@/app/actions';
import { INITIAL_CORRELATION_DATA, FOREX_PAIRS, SValue, Bias, Correlation, Currency, ForexPairGroup } from '@/lib/constants';
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

type AiRecommendation = {
  pair: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
};

type Tab = 'correlation' | 'trade-plan' | 'ai-insights' | 'budgeting';

export default function TradeInsightsDashboard() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>('correlation');

  const [correlationData, setCorrelationData] = useState<Correlation[]>(INITIAL_CORRELATION_DATA);
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('');
  
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[] | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const TABS: { id: Tab; label: string; }[] = [
    { id: 'correlation', label: '1. Correlation' },
    { id: 'trade-plan', label: '2. Trade Plan' },
    { id: 'ai-insights', label: '3. AI Insights' },
    { id: 'budgeting', label: '4. Budgeting' },
  ];

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
  
  const forexPairsWithBiasByGroup = useMemo(() => {
    const sValueMap = new Map(correlationTableData.map(c => [c.id, c.s]));
    return FOREX_PAIRS.map(group => ({
      ...group,
      pairs: group.pairs.map(pair => {
        const sBase = sValueMap.get(pair.base) ?? 'Neutral';
        const sQuote = sValueMap.get(pair.quote) ?? 'Neutral';
        const bias = calculateBias(sBase, sQuote);
        return { ...pair, bias, sBase, sQuote };
      })
    }));
  }, [correlationTableData]);

  const filteredCurrencies = useMemo(() =>
    correlationTableData.filter(c => c.id.toLowerCase().includes(currencyFilter.toLowerCase())),
    [correlationTableData, currencyFilter]
  );
  
  const filteredPairGroups: ForexPairGroup[] = useMemo(() => {
    if (!pairFilter) {
      return FOREX_PAIRS;
    }
    return FOREX_PAIRS
      .map(group => ({
        ...group,
        pairs: group.pairs.filter(p => p.pair.toLowerCase().includes(pairFilter.toLowerCase()))
      }))
      .filter(group => group.pairs.length > 0 || group.index.toLowerCase().includes(pairFilter.toLowerCase()));
  }, [pairFilter]);

  const handleGenerateInsights = () => {
    const insightInput = {
      forexPairs: forexPairsWithBiasByGroup.flatMap(g => g.pairs).map(({ pair, bias }) => ({ pair, bias }))
    };
    
    setIsLoadingAi(true);
    setAiRecommendations(null);

    startTransition(async () => {
      const result = await getAiInsightsAction(insightInput);
      if ('error' in result) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        setAiRecommendations(result.recommendations);
        navigateToTab('ai-insights');
      }
      setIsLoadingAi(false);
    });
  };
  
  const getBadgeClass = (value: SValue | Bias | AiRecommendation['action']) => {
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

  const navigateToTab = (tab: Tab) => {
    if (tab === 'trade-plan' && !hasCorrelationValues) {
        toast({
            title: "No Correlation Data",
            description: "Please enter correlation values before generating a trade plan.",
            variant: "destructive",
        });
        return;
    }
    setActiveTab(tab);
  };

  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) {
        navigateToTab(TABS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      if (currentIndex > 0) {
          setActiveTab(TABS[currentIndex - 1].id);
      }
  };

  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="space-y-8">
      <header className="text-left">
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-primary">
          Trade Insights
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          AI-powered analysis for your Forex trading strategy.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => navigateToTab(value as Tab)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            {TABS.map((tab, index) => (
                <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    disabled={index > currentTabIndex && (tab.id !== 'trade-plan' || !hasCorrelationValues)}
                >
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="correlation" className="mt-6 space-y-8">
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
        </TabsContent>

        <TabsContent value="trade-plan" className="mt-6 space-y-8">
            <section id="forex-pairs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="font-headline text-2xl font-semibold">Forex Pairs</h2>
                 <Button onClick={handleGenerateInsights} disabled={isPending || isLoadingAi || !hasCorrelationValues}>
                  <Cpu className="mr-2 h-4 w-4" />
                  {isLoadingAi ? 'Generating...' : 'Generate AI Insights'}
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                {forexPairsWithBiasByGroup.map(group => (
                    <div key={group.index} className="border-b last:border-b-0">
                      <h3 className="px-6 py-4 text-lg font-medium bg-secondary/50">{group.index}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='pl-6'>Pair</TableHead>
                            <TableHead className="text-right pr-6">Bias</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.pairs
                            .filter(p => !pairFilter || p.pair.toLowerCase().includes(pairFilter.toLowerCase()) || group.index.toLowerCase().includes(pairFilter.toLowerCase()))
                            .map(pair => (
                            <TableRow key={pair.pair}>
                              <TableCell className="font-medium pl-6">{pair.pair}</TableCell>
                              <TableCell className="text-right pr-6">
                                <Badge variant="outline" className={cn("font-semibold", getBadgeClass(pair.bias))}>
                                  {pair.bias}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
        </TabsContent>
        
        <TabsContent value="ai-insights" className="mt-6 space-y-6">
          <Card className="bg-primary/5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Bot className="text-primary" />
                AI Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAi && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-24" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoadingAi && aiRecommendations && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiRecommendations.map((rec) => (
                    <Card key={rec.pair} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{rec.pair}</span>
                           <Badge variant="outline" className={cn("font-semibold", getBadgeClass(rec.action))}>
                              {rec.action}
                            </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoadingAi && !aiRecommendations && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Generate AI Insights from the Trade Plan tab to see recommendations.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgeting" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Budgeting</CardTitle>
                    <CardDescription>This section is under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Budgeting tools and features will be available here soon.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8">
        <Button onClick={handlePrev} disabled={currentTabIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
        </Button>
        <Button onClick={handleNext} disabled={currentTabIndex === TABS.length - 1 || (activeTab === 'correlation' && !hasCorrelationValues)}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}
