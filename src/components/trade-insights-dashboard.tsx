'use client';

import { useState, useMemo, useTransition, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Bot, Cpu, Moon, Sun, Settings, Trash2, AlertTriangle, QrCode, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiInsightsAction } from '@/app/actions';
import { INITIAL_CORRELATION_DATA, FOREX_PAIRS, SValue, Bias, Correlation, Currency, ForexPairGroup } from '@/lib/constants';
import { calculateT, calculateS, calculateBias, calculatePipValue } from '@/lib/trade-utils';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { QrScanner } from './qr-scanner';
import QRCode from 'qrcode.react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  tBase: number;
  tQuote: number;
  confidence: number;
};

type AiRecommendation = {
  pair: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
  confidence: number;
};

type BudgetItem = {
  id: string; // pair name
  pair: string;
  action: Bias | AiRecommendation['action'];
  lotSize: number;
  sl: number;
  tp: number;
  hasNews: boolean;
};


type Tab = 'correlation' | 'trade-plan' | 'ai-insights' | 'budgeting';
type Theme = 'light' | 'dark';
type BiasFilter = 'ALL' | 'BUY/SELL' | 'NEUTRAL';

const LOCAL_STORAGE_KEY = 'tradeInsightsDashboardState';

export default function TradeInsightsDashboard({ version }: { version: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>('correlation');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isClient, setIsClient] = useState(false);

  const [correlationData, setCorrelationData] = useState<Correlation[]>(INITIAL_CORRELATION_DATA);
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [forexPairFilter, setForexPairFilter] = useState('');
  const [biasFilter, setBiasFilter] = useState<BiasFilter>('ALL');
  
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[] | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [capital, setCapital] = useState(1000);
  const [newsWarnings, setNewsWarnings] = useState<Record<string, boolean>>({});

  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [qrData, setQrData] = useState('');


  const TABS: { id: Tab; label: string; }[] = [
    { id: 'correlation', label: 'Directions' },
    { id: 'trade-plan', label: 'Trade Plan' },
    { id: 'ai-insights', label: 'AI Insights' },
    { id: 'budgeting', label: 'Budgeting' },
  ];

  useEffect(() => {
    setIsClient(true);
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { correlationData, aiRecommendations, budgetItems, theme, capital, newsWarnings } = JSON.parse(savedState);
        if (correlationData) setCorrelationData(correlationData);
        if (aiRecommendations) setAiRecommendations(aiRecommendations);
        if (budgetItems) setBudgetItems(budgetItems);
        if (theme) setTheme(theme);
        if (capital) setCapital(capital);
        if (newsWarnings) setNewsWarnings(newsWarnings);
      }
    } catch (error) {
      console.error("Failed to load state from local storage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const stateToSave = JSON.stringify({ correlationData, aiRecommendations, budgetItems, theme, capital, newsWarnings });
        localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
      } catch (error) {
        console.error("Failed to save state to local storage", error);
      }
    }
  }, [correlationData, aiRecommendations, budgetItems, theme, capital, newsWarnings, isClient]);


  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleClearData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCorrelationData(INITIAL_CORRELATION_DATA.map(c => ({...c, d1: 0, '4h': 0, '1h': 0})));
    setAiRecommendations(null);
    setBudgetItems([]);
    setTheme('dark');
    setCapital(1000);
    setNewsWarnings({});
    setActiveTab('correlation');
    toast({
      title: 'Data Cleared',
      description: 'All your saved data has been removed.',
    });
  };

  const handleCorrelationChange = (id: Currency, field: keyof Omit<Correlation, 'id'>, value: string) => {
    const numericValue = parseFloat(value);
    setCorrelationData((prevData) =>
      prevData.map((row) =>
        row.id === id ? { ...row, [field]: isNaN(numericValue) ? '' : numericValue } : row
      )
    );
  };
  
  const handleQrScan = (data: string | null) => {
    setShowQrScanner(false);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0 && 'id' in parsedData[0] && 'd1' in parsedData[0]) {
          setCorrelationData(parsedData);
          toast({
            title: "Data Loaded",
            description: "Correlation data has been loaded from the QR code.",
          });
          navigateToTab('correlation');
        } else {
          throw new Error("Invalid data format");
        }
      } catch (e) {
        console.error("Failed to parse QR code data", e);
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: "The QR code does not contain valid correlation data.",
        });
      }
    }
  };

  const openQrGenerator = () => {
    const dataToShare = JSON.stringify(correlationData);
    setQrData(dataToShare);
    setShowQrGenerator(true);
  };

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData('text');
    const rows = pasteData.split('\n').filter(row => row.trim() !== '');

    let updatedCount = 0;
    setCorrelationData(prevData => {
      const newData = [...prevData];
      const dataMap = new Map(newData.map(item => [item.id, item]));

      rows.forEach(row => {
        const columns = row.split('\t');
        if (columns.length >= 4) {
          const id = columns[0].trim().toUpperCase() as Currency;
          const d1 = parseFloat(columns[1]);
          const h4 = parseFloat(columns[2]);
          const h1 = parseFloat(columns[3]);

          if (dataMap.has(id) && !isNaN(d1) && !isNaN(h4) && !isNaN(h1)) {
            const item = dataMap.get(id)!;
            item.d1 = d1;
            item['4h'] = h4;
            item['1h'] = h1;
            updatedCount++;
          }
        }
      });
      return Array.from(dataMap.values());
    });
    if (updatedCount > 0) {
      toast({
        title: "Data Pasted",
        description: `Successfully updated ${updatedCount} currencies.`,
      });
    } else {
        toast({
            title: "Paste Failed",
            description: "Could not parse valid data from clipboard.",
            variant: "destructive"
        })
    }
  }, [toast]);


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
  
  const forexPairsWithBiasByGroup: ForexPairGroup[] = useMemo(() => {
    const sValueMap = new Map(correlationTableData.map(c => [c.id, c.s]));
    const tValueMap = new Map(correlationTableData.map(c => [c.id, c.t]));
    return FOREX_PAIRS.map(group => ({
      ...group,
      pairs: group.pairs.map(pair => {
        const sBase = sValueMap.get(pair.base) ?? 'Neutral';
        const sQuote = sValueMap.get(pair.quote) ?? 'Neutral';
        const tBase = tValueMap.get(pair.base) ?? 0;
        const tQuote = tValueMap.get(pair.quote) ?? 0;
        const bias = calculateBias(sBase, sQuote);
        const confidence = Math.abs(tBase) + Math.abs(tQuote);
        return { ...pair, bias, sBase, sQuote, tBase, tQuote, confidence };
      })
    }));
  }, [correlationTableData]);

  const filteredForexPairGroups = useMemo(() => {
    let intermediateGroups = forexPairsWithBiasByGroup;

    if (biasFilter !== 'ALL') {
      intermediateGroups = intermediateGroups
        .map(group => ({
          ...group,
          pairs: group.pairs.filter(pair => {
              if (biasFilter === 'BUY/SELL') return pair.bias === 'BUY' || pair.bias === 'SELL';
              return pair.bias === biasFilter;
          })
        }))
        .filter(group => group.pairs.length > 0);
    }

    if(forexPairFilter) {
        intermediateGroups = intermediateGroups.map(group => ({
            ...group,
            pairs: group.pairs.filter(pair => pair.pair.toLowerCase().includes(forexPairFilter.toLowerCase()))
        })).filter(group => group.pairs.length > 0);
    }
    
    return intermediateGroups;

  }, [forexPairsWithBiasByGroup, biasFilter, forexPairFilter]);

  const filteredCurrencies = useMemo(() =>
    correlationTableData.filter(c => c.id.toLowerCase().includes(currencyFilter.toLowerCase())),
    [correlationTableData, currencyFilter]
  );
  
  const allForexPairsWithBias: ForexPairWithBias[] = useMemo(() => forexPairsWithBiasByGroup.flatMap(g => g.pairs), [forexPairsWithBiasByGroup]);

  const handleGenerateInsights = () => {
    const insightInput = {
      forexPairs: allForexPairsWithBias.map(({ pair, bias, confidence }) => ({ 
        pair, 
        bias,
        confidence,
      }))
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

  const handleToggleNewsWarning = (pair: string) => {
    setNewsWarnings(prev => ({ ...prev, [pair]: !prev[pair] }));
  };
  
  const handleBudgetSelectionChange = (item: ForexPairWithBias | AiRecommendation, isSelected: boolean) => {
    const budgetItem: BudgetItem = {
      id: item.pair,
      pair: item.pair,
      action: 'bias' in item ? item.bias : item.action,
      lotSize: 0.01,
      sl: 0,
      tp: 0,
      hasNews: newsWarnings[item.pair] || false,
    };

    setBudgetItems(prev => {
      const existing = prev.find(i => i.id === budgetItem.id);
      if (isSelected && !existing) {
        return [...prev, budgetItem];
      }
      if (!isSelected && existing) {
        return prev.filter(i => i.id !== budgetItem.id);
      }
      return prev;
    });
  };
  
  useEffect(() => {
    setBudgetItems(prev =>
      prev.map(item => ({
        ...item,
        hasNews: newsWarnings[item.pair] || false,
      }))
    );
  }, [newsWarnings]);

  const handleBudgetItemChange = (id: string, field: keyof Omit<BudgetItem, 'id' | 'pair' | 'action'>, value: string) => {
    const numericValue = parseFloat(value);
    setBudgetItems(prev => prev.map(item => item.id === id ? { ...item, [field]: isNaN(numericValue) ? '' : numericValue } : item));
  }
  
  const budgetSummary = useMemo(() => {
    const totalRisk = budgetItems.reduce((acc, item) => acc + calculatePipValue(item.pair, item.lotSize, item.sl), 0);
    const totalReward = budgetItems.reduce((acc, item) => acc + calculatePipValue(item.pair, item.lotSize, item.tp), 0);
    const riskPercentOfCapital = capital > 0 ? (totalRisk / capital) * 100 : 0;
    const rewardPercentOfCapital = capital > 0 ? (totalReward / capital) * 100 : 0;
    
    return { totalRisk, totalReward, riskPercentOfCapital, rewardPercentOfCapital };
  }, [budgetItems, capital]);


  const getBadgeClass = (value: SValue | Bias | AiRecommendation['action']) => {
    switch(value) {
      case 'Strong':
      case 'Extreme Strong':
      case 'BUY':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'Weak':
      case 'Extreme Weak':
      case 'SELL':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
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

  if (!isClient) {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-start">
            <div className="text-left">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
        <div className="flex justify-between mt-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div className="text-left">
            <h1 className="font-headline text-xl font-bold tracking-tight text-primary flex items-baseline gap-2">
            <span>JMG-TD</span>
            <span className="text-xs font-mono text-muted-foreground">v{version}</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowQrScanner(true)} aria-label="Scan QR Code">
              <QrCode className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Application Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    Manage your application data and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="pt-4 flex flex-col gap-4">
                  <Button onClick={openQrGenerator} variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Correlation Data
                  </Button>
                  <Button onClick={handleClearData} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </div>
      </header>

      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at a QR code to load the correlation data.
            </DialogDescription>
          </DialogHeader>
          <QrScanner onScan={handleQrScan} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowQrScanner(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showQrGenerator} onOpenChange={setShowQrGenerator}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Correlation Data</DialogTitle>
            <DialogDescription>
              Scan this QR code with another device to transfer your correlation data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrData && <QRCode value={qrData} size={256} />}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Tabs value={activeTab} onValueChange={(value) => navigateToTab(value as Tab)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            {TABS.map((tab) => (
                <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    disabled={tab.id === 'trade-plan' && !hasCorrelationValues}
                >
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="correlation" className="mt-6 space-y-8">
           <section id="correlation-index" onPaste={handlePaste}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div>
                <h2 className="font-headline text-2xl font-semibold">Directions</h2>
                <p className="text-xs text-muted-foreground">Enter values manually or paste from a spreadsheet (Ctrl+V/Cmd+V).</p>
              </div>
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
                              value={corr[field] === 0 ? '' : corr[field]}
                              onChange={(e) => handleCorrelationChange(corr.id, field, e.target.value)}
                              className="w-24 h-8"
                              placeholder="0"
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
                <div className="space-y-2">
                  <h2 className="font-headline text-2xl font-semibold">Forex Pairs</h2>
                  <RadioGroup defaultValue="ALL" value={biasFilter} onValueChange={(value: BiasFilter) => setBiasFilter(value)} className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ALL" id="bias-all" />
                      <Label htmlFor="bias-all">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BUY/SELL" id="bias-buysell" />
                      <Label htmlFor="bias-buysell">Buy/Sell</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NEUTRAL" id="bias-neutral" />
                      <Label htmlFor="bias-neutral">Neutral</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter pairs..."
                        className="max-w-xs"
                        value={forexPairFilter}
                        onChange={(e) => setForexPairFilter(e.target.value)}
                    />
                     <Button onClick={handleGenerateInsights} disabled={isPending || isLoadingAi || !hasCorrelationValues}>
                      <Cpu className="mr-2 h-4 w-4" />
                      {isLoadingAi ? 'Generating...' : 'Generate AI Insights'}
                    </Button>
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                {filteredForexPairGroups.map(group => (
                    <div key={group.index} className="border-b last:border-b-0">
                      <h3 className="px-6 py-4 text-lg font-medium bg-secondary/50">{group.index}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-12'></TableHead>
                            <TableHead className='pl-2'>Pair</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>News</TableHead>
                            <TableHead className="text-right pr-6">Bias</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.pairs.map(pair => (
                            <TableRow key={pair.pair}>
                               <TableCell>
                                <Checkbox
                                    id={`budget-tp-${pair.pair}`}
                                    aria-label={`Select ${pair.pair} for budgeting`}
                                    onCheckedChange={(checked) => handleBudgetSelectionChange(pair, !!checked)}
                                    checked={budgetItems.some(i => i.id === pair.pair)}
                                />
                               </TableCell>
                              <TableCell className="font-medium pl-2">{pair.pair}</TableCell>
                              <TableCell className="font-mono">
                                {pair.confidence}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("h-8 w-8", !!newsWarnings[pair.pair] ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground/50 hover:text-muted-foreground')}
                                  onClick={() => handleToggleNewsWarning(pair.pair)}
                                  aria-label={`Toggle news warning for ${pair.pair}`}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </TableCell>
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
                  {[...Array(6)].map((_, i) => (
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
                        <CardDescription className="flex items-center justify-between">
                          <span>Confidence: {rec.confidence}</span>
                          {newsWarnings[rec.pair] && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="News warning" />
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      </CardContent>
                       <CardFooter>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`budget-ai-${rec.pair}`}
                              aria-label={`Select ${rec.pair} for budgeting`}
                              onCheckedChange={(checked) => handleBudgetSelectionChange(rec, !!checked)}
                              checked={budgetItems.some(i => i.id === rec.pair)}
                            />
                            <label
                              htmlFor={`budget-ai-${rec.pair}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Add to Budget
                            </label>
                          </div>
                      </CardFooter>
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
                    <CardTitle>Budgeting Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    {budgetItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pair</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>News</TableHead>
                                    <TableHead>Lot Size</TableHead>
                                    <TableHead>SL (pips)</TableHead>
                                    <TableHead>TP (pips)</TableHead>
                                    <TableHead>RRR</TableHead>
                                    <TableHead className="text-right">Risk/Reward</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {budgetItems.map(item => {
                                  const slValue = calculatePipValue(item.pair, item.lotSize, item.sl);
                                  const tpValue = calculatePipValue(item.pair, item.lotSize, item.tp);
                                  const rrr = item.sl > 0 ? (item.tp / item.sl).toFixed(1) : 0;

                                  return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.pair}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-semibold", getBadgeClass(item.action))}>
                                                {item.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {item.hasNews && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                              type="number" 
                                              value={item.lotSize === 0 ? '' : item.lotSize}
                                              onChange={e => handleBudgetItemChange(item.id, 'lotSize', e.target.value)}
                                              placeholder="0.01" 
                                              className="w-24 h-8" 
                                              step="0.01"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                              type="number" 
                                              value={item.sl === 0 ? '' : item.sl}
                                              onChange={e => handleBudgetItemChange(item.id, 'sl', e.target.value)}
                                              placeholder="pips"
                                              className="w-24 h-8" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                              type="number"
                                              value={item.tp === 0 ? '' : item.tp}
                                              onChange={e => handleBudgetItemChange(item.id, 'tp', e.target.value)}
                                              placeholder="pips"
                                              className="w-24 h-8" 
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono">
                                          {item.sl > 0 ? `1:${rrr}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                          <div className='flex flex-col items-end'>
                                            <span className='text-red-500'>-{slValue.toFixed(2)}</span>
                                            <span className='text-green-500'>+{tpValue.toFixed(2)}</span>
                                          </div>
                                        </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Select items from the "Trade Plan" or "AI Insights" tabs to add them to your budget.</p>
                        </div>
                    )}
                </CardContent>
                {budgetItems.length > 0 && (
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                    <h3 className="font-headline text-lg font-semibold">Summary</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full max-w-md">
                        <div className='col-span-2 space-y-2'>
                          <div className="flex items-center gap-4">
                              <Label htmlFor="capital" className="w-40">Capital</Label>
                              <Input 
                                id="capital"
                                type="number" 
                                value={capital === 0 ? '' : capital}
                                onChange={e => setCapital(parseFloat(e.target.value) || 0)}
                                className="w-36 h-8"
                                placeholder="0"
                              />
                          </div>
                        </div>

                        <div className="font-medium text-muted-foreground">Total Potential Risk:</div>
                        <div className="text-right font-mono text-red-500">-{budgetSummary.totalRisk.toFixed(2)}</div>
                        
                        <div className="font-medium text-muted-foreground">Total Potential Reward:</div>
                        <div className="text-right font-mono text-green-500">+{budgetSummary.totalReward.toFixed(2)}</div>

                        <div className="font-medium text-muted-foreground">Risk % of Capital:</div>
                        <div className="text-right font-mono">{budgetSummary.riskPercentOfCapital.toFixed(2)}%</div>

                        <div className="font-medium text-muted-foreground">Reward % of Capital:</div>
                        <div className="text-right font-mono">{budgetSummary.rewardPercentOfCapital.toFixed(2)}%</div>
                    </div>
                </CardFooter>
                )}
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
