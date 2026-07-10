import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, XCircle, ShieldCheck, RefreshCw, 
  Settings, Layers, Compass, BarChart4, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';

// Sub-components
import ConnectionWizard from '../components/Apps/ConnectionWizard';
import StatementImporter from '../components/Apps/StatementImporter';
import OrderTracker from '../components/Apps/OrderTracker';
import ConsolidatedFinancials from '../components/Apps/ConsolidatedFinancials';

type ActiveTab = 'connections' | 'ingestion' | 'analytics' | 'tracker';

export default function Apps() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('connections');
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingId, setIsSyncingId] = useState<string | null>(null);

  // Wizard state
  const [wizardPlatform, setWizardPlatform] = useState<{ id: string; name: string } | null>(null);

  const fetchData = async () => {
    try {
      const [platformRes, logsRes, connectionRes] = await Promise.all([
        api.get('/platforms'),
        api.get('/worklogs'),
        api.get('/platforms/connections')
      ]);
      
      if (platformRes.data.success && logsRes.data.success && connectionRes.data.success) {
        const platformsList = platformRes.data.data;
        const allLogs = logsRes.data.data || [];
        const activeConnections = connectionRes.data.connections || {};

        setWorkLogs(allLogs);
        setConnections(activeConnections);
        
        const platformConfigs: Record<string, { logo: string; color: string }> = {
          swiggy: { logo: 'Swiggy', color: 'bg-orange-500 text-white' },
          zomato: { logo: 'Zomato', color: 'bg-red-500 text-white' },
          rapido: { logo: 'Rapido', color: 'bg-yellow-500 text-black' },
          blinkit: { logo: 'Blinkit', color: 'bg-yellow-400 text-black' },
          zepto: { logo: 'Zepto', color: 'bg-purple-600 text-white' },
          instamart: { logo: 'Instamart', color: 'bg-pink-500 text-white' },
          uber: { logo: 'Uber', color: 'bg-black text-white' },
          bigbasket: { logo: 'BigBasket', color: 'bg-green-600 text-white' },
        };

        const enriched = platformsList.map((p: any) => {
          const platformLogs = allLogs.filter((l: any) => l.platform.toLowerCase() === p.id.toLowerCase());
          const connectionDetails = activeConnections[p.id.toLowerCase()];
          
          let totalEarnings = 0;
          let totalOrders = 0;
          let totalExpenses = 0;
          let lastDate = 'No shifts';

          if (platformLogs.length > 0) {
            platformLogs.forEach((l: any) => {
              totalEarnings += Number(l.totalEarnings || l.grossEarnings || 0);
              totalOrders += Number(l.ordersCompleted || 0);
              totalExpenses += Number(l.fuelCost || 0) + Number(l.otherExpenses || 0);
            });
            
            // Get latest log date
            const sortedLogs = [...platformLogs].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestDate = new Date(sortedLogs[0].date);
            lastDate = latestDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          }

          const config = platformConfigs[p.id.toLowerCase()] || { logo: p.logo || p.name[0], color: 'bg-primary text-white' };

          return {
            id: p.id,
            name: p.name,
            logo: config.logo,
            color: config.color,
            totalEarnings,
            totalOrders,
            netProfit: totalEarnings - totalExpenses,
            lastWorkingDate: lastDate,
            status: p.active ? 'Active' : 'Inactive',
            isConnected: !!connectionDetails?.connected,
            connectionDetails
          };
        });

        setPlatforms(enriched);
      }
    } catch (error) {
      toast.error('Failed to load rider platforms and connection metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger background poll / sync
  const handleSyncNow = async (platId: string) => {
    setIsSyncingId(platId);
    try {
      const res = await api.post(`/platforms/${platId}/sync`);
      if (res.data.success) {
        toast.success(res.data.message || 'Background polling successful!');
        await fetchData();
      } else {
        toast.error('Sync failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Synchronization failed.');
    } finally {
      setIsSyncingId(null);
    }
  };

  // Disconnect Account
  const handleDisconnect = async (platId: string) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${platId.toUpperCase()} account? Historically synced shifts will remain safe.`)) {
      return;
    }

    try {
      const res = await api.post(`/platforms/${platId}/disconnect`);
      if (res.data.success) {
        toast.success(`Disconnected ${platId.toUpperCase()} successfully.`);
        await fetchData();
      }
    } catch (err) {
      toast.error('Disconnection failed.');
    }
  };

  const connectedPlatformsIds = platforms.filter(p => p.isConnected).map(p => p.id);

  // Generate intelligent insights based on worklogs
  const generateInsights = () => {
    if (workLogs.length === 0) return [];

    const insights = [];
    const platformEarnings: Record<string, number> = {};
    let totalFuel = 0;
    let totalGross = 0;

    workLogs.forEach(log => {
      const p = log.platform?.toLowerCase();
      const gross = Number(log.grossEarnings || 0);
      const fuel = Number(log.fuelCost || 0);
      
      totalGross += gross;
      totalFuel += fuel;
      platformEarnings[p] = (platformEarnings[p] || 0) + gross;
    });

    // 1. Highest earning platform
    const sorted = Object.entries(platformEarnings).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      insights.push({
        type: 'success',
        title: `${sorted[0][0].toUpperCase()} is your highest-earning platform`,
        text: `You have made a total of ${formatCurrency(sorted[0][1])} on ${sorted[0][0].toUpperCase()}. Consider allocating peak delivery hours here.`
      });
    }

    // 2. High fuel warning
    if (totalGross > 0 && (totalFuel / totalGross) > 0.20) {
      insights.push({
        type: 'warning',
        title: 'High transit fuel expenditure detected',
        text: `Your fuel costs account for ${((totalFuel / totalGross) * 100).toFixed(0)}% of your gross earnings. Consider servicing your scooter or mapping tight routes.`
      });
    }

    // 3. Complete tax calculation insight
    insights.push({
      type: 'info',
      title: 'Estimated TDS / Commission payout calculation',
      text: 'Remember to save 5% of your payout for quarterly TDS filings. Your current estimated withholding stands at ' + formatCurrency(Math.floor(totalGross * 0.05)) + '.'
    });

    return insights;
  };

  const activeInsights = generateInsights();

  return (
    <div className="space-y-8">
      {/* Immersive Banner Header */}
      <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Layers className="w-40 h-40" />
        </div>

        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Secure Integrations Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Multi-Platform Earnings Consolidation
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed">
            Link and consolidate your delivery accounts from Swiggy, Zomato, Uber, and others. Sync shift earnings, tip pools, incentives, and fuel metrics into one encrypted dashboard.
          </p>
        </div>
      </div>

      {/* Primary Tab Control */}
      <div className="flex border-b border-border/80 pb-0.5 overflow-x-auto gap-6 text-sm">
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'connections'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Settings className="w-4 h-4" />
          Rider Account Connections
        </button>
        <button
          onClick={() => setActiveTab('ingestion')}
          className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ingestion'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          Bulk Statement Ingestion
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <BarChart4 className="w-4 h-4" />
          Consolidated Financials
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tracker'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Compass className="w-4 h-4 animate-pulse" />
          Real-time Order Tracker
        </button>
      </div>

      {/* Main Tab View Contents */}
      {isLoading ? (
        <div className="py-20 text-center text-text-secondary flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="font-semibold">Decrypting secure connections database...</span>
        </div>
      ) : (
        <div id="apps-workspace-wrapper" className="space-y-6">
          
          {/* Tab 1: Rider Connections Grid */}
          {activeTab === 'connections' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-all border border-border bg-surface relative overflow-hidden flex flex-col justify-between">
                    <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Card Header Info */}
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm tracking-tighter ${app.color}`}>
                            {app.logo}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              app.isConnected 
                                ? 'bg-success/10 text-success border-success/20' 
                                : 'bg-surface-card text-text-secondary border-border'
                            }`}>
                              {app.isConnected ? 'Connected' : 'Disconnected'}
                            </span>

                            {app.isConnected && (
                              <span className="text-[9px] text-text-secondary">
                                Sync: {app.connectionDetails?.syncType === 'api' ? 'Official API' : 'Portal'}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-text-primary">{app.name}</h3>
                        <p className="text-xs text-text-secondary mt-1">Official driver delivery client mapping integration.</p>

                        {/* Connection statistics details */}
                        <div className="mt-4 pt-4 border-t border-border/60 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Imported Earnings</span>
                            <span className="font-bold text-text-primary">{formatCurrency(app.totalEarnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Completed Shifts</span>
                            <span className="font-medium text-text-primary">{app.totalOrders} trips</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Last Synced</span>
                            <span className="font-medium text-text-primary">
                              {app.isConnected && app.connectionDetails?.lastSyncedAt 
                                ? new Date(app.connectionDetails.lastSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : app.lastWorkingDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-border/60 flex gap-2 mt-4">
                        {app.isConnected ? (
                          <>
                            <Button 
                              variant="outline" 
                              className="flex-1 text-xs py-2"
                              onClick={() => handleSyncNow(app.id)}
                              disabled={isSyncingId !== null}
                            >
                              {isSyncingId === app.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : 'Sync Now'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="px-3 border-error/20 text-error hover:bg-error/5"
                              onClick={() => handleDisconnect(app.id)}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button 
                            className="w-full text-xs py-2"
                            onClick={() => setWizardPlatform({ id: app.id, name: app.name })}
                          >
                            Secure Account Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Intelligent Insights & Notification Center */}
              <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Intelligent Rider Insights & Warnings
                </h3>

                {activeInsights.length === 0 ? (
                  <p className="text-xs text-text-secondary">Connect delivery accounts to analyze margins, fuel spikes, and tax TDS deductions.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeInsights.map((ins, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 border rounded-xl space-y-1.5 ${
                          ins.type === 'success' 
                            ? 'border-success/20 bg-success/5 text-success' 
                            : ins.type === 'warning'
                            ? 'border-warning/20 bg-warning/5 text-warning'
                            : 'border-primary/20 bg-primary/5 text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {ins.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                          <h4 className="text-xs font-bold uppercase tracking-wide">{ins.title}</h4>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Statement Importer */}
          {activeTab === 'ingestion' && (
            <StatementImporter 
              platformsList={platforms} 
              onImportComplete={fetchData} 
            />
          )}

          {/* Tab 3: Consolidated Financial Dashboard */}
          {activeTab === 'analytics' && (
            <ConsolidatedFinancials 
              workLogs={workLogs} 
              connectedPlatforms={connectedPlatformsIds} 
            />
          )}

          {/* Tab 4: Real-time Order Tracker */}
          {activeTab === 'tracker' && (
            <OrderTracker 
              connectedPlatforms={connectedPlatformsIds} 
              platformsList={platforms}
              onOrderCompleted={fetchData} 
            />
          )}
        </div>
      )}

      {/* Connection Wizard Dialog Overlay Modal */}
      {wizardPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1.5 hover:bg-surface-card rounded-full"
              onClick={() => setWizardPlatform(null)}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <ConnectionWizard
              platformId={wizardPlatform.id}
              platformName={wizardPlatform.name}
              onClose={() => setWizardPlatform(null)}
              onSuccess={() => {
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
