import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Check, AlertTriangle, Play, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';

interface StatementImporterProps {
  platformsList: any[];
  onImportComplete: () => void;
}

export default function StatementImporter({ platformsList, onImportComplete }: StatementImporterProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platformsList[0]?.id || 'swiggy');
  const [activeSubTab, setActiveSubTab] = useState<'csv' | 'email'>('csv');
  const [consentGiven, setConsentGiven] = useState(false);

  // CSV states
  const [csvText, setCsvText] = useState(
    'Date,Hours,Orders,Earnings,Tips,Fuel\n' +
    '2026-07-07,8.5,14,1250,150,120\n' +
    '2026-07-06,7.2,11,980,80,100\n' +
    '2026-07-05,9.0,16,1450,200,150'
  );
  const [parsedCsvRows, setParsedCsvRows] = useState<any[]>([]);
  const [isCsvPreviewing, setIsCsvPreviewing] = useState(false);

  // Email states
  const [emailText, setEmailText] = useState(
    `From: Swiggy Rider Payouts <payouts@swiggy.in>\n` +
    `Subject: Payout Summary for 07-Jul-2026\n\n` +
    `Hi Rider, here is your daily summary:\n` +
    `Date: 2026-07-07\n` +
    `Online Hours: 8.5 Hours\n` +
    `Deliveries Completed: 15 Trips\n` +
    `Orders Base Pay: Rs. 950.00\n` +
    `Incentives & Weekly Milestones: Rs. 300.00\n` +
    `Customer Tips: Rs. 120.00\n` +
    `Estimated Kilometers Traveled: 63 km\n\n` +
    `Thank you for your hard work!`
  );
  const [isParsingEmail, setIsParsingEmail] = useState(false);
  const [parsedEmailResult, setParsedEmailResult] = useState<any | null>(null);
  const [isAiParsed, setIsAiParsed] = useState(false);

  // Parse CSV client-side for immediate preview
  const handlePreviewCsv = () => {
    if (!consentGiven) {
      toast.error('You must give explicit consent to parse your statements.');
      return;
    }

    try {
      const rows = csvText.trim().split('\n');
      if (rows.length < 2) {
        toast.error('CSV statement is empty or invalid.');
        return;
      }

      const headers = rows[0].toLowerCase().split(',');
      const parsed: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const columns = rows[i].split(',');
        const rowData: any = {};

        headers.forEach((h, idx) => {
          const val = columns[idx]?.trim();
          if (h.includes('date')) {
            rowData.date = val;
          } else if (h.includes('hours') || h.includes('hr')) {
            rowData.hoursWorked = parseFloat(val) || 0;
          } else if (h.includes('orders') || h.includes('trips')) {
            rowData.ordersCompleted = parseInt(val) || 0;
          } else if (h.includes('earnings') || h.includes('gross') || h.includes('pay')) {
            rowData.grossEarnings = parseFloat(val) || 0;
          } else if (h.includes('tips')) {
            rowData.tips = parseFloat(val) || 0;
          } else if (h.includes('fuel') || h.includes('gas')) {
            rowData.fuelCost = parseFloat(val) || 0;
          }
        }
        );

        if (rowData.date) {
          parsed.push(rowData);
        }
      }

      if (parsed.length === 0) {
        toast.error('No valid rows could be parsed. Check columns: Date, Hours, Orders, Earnings.');
        return;
      }

      setParsedCsvRows(parsed);
      setIsCsvPreviewing(true);
      toast.success(`Successfully parsed ${parsed.length} rows! Review them below.`);
    } catch (e) {
      toast.error('Error parsing CSV. Ensure correct comma-separated formatting.');
    }
  };

  // Submit Bulk Logs to Backend
  const handleImportCsv = async () => {
    try {
      const res = await api.post('/platforms/bulk-import', {
        platform: selectedPlatform,
        logs: parsedCsvRows
      });

      if (res.data.success) {
        toast.success(res.data.message || 'CSV imported successfully!');
        setParsedCsvRows([]);
        setIsCsvPreviewing(false);
        onImportComplete();
      } else {
        toast.error(res.data.message || 'Import failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit imported logs.');
    }
  };

  // Parse email payout text via backend (Gemini AI or fallback)
  const handleParseEmail = async () => {
    if (!consentGiven) {
      toast.error('You must give explicit consent to parse your email.');
      return;
    }

    setIsParsingEmail(true);
    setParsedEmailResult(null);

    try {
      const res = await api.post('/platforms/parse-email', {
        emailText,
        platform: selectedPlatform
      });

      if (res.data.success) {
        setParsedEmailResult(res.data.data);
        setIsAiParsed(res.data.isAiParsed);
        toast.success(res.data.isAiParsed ? 'AI parsed email statement successfully!' : 'Parsed via expression extractor!');
      } else {
        toast.error('Parsing failed.');
      }
    } catch (err: any) {
      toast.error('handshake failed to connect with parser.');
    } finally {
      setIsParsingEmail(false);
    }
  };

  // Import parsed email result as single shift
  const handleImportParsedEmail = async () => {
    if (!parsedEmailResult) return;

    try {
      // Create work log entry on backend
      const res = await api.post('/worklogs', {
        platform: selectedPlatform,
        date: parsedEmailResult.date,
        loginTime: '08:30',
        logoutTime: '17:00',
        ordersCompleted: parsedEmailResult.ordersCompleted,
        hoursWorked: parsedEmailResult.hoursWorked,
        grossEarnings: parsedEmailResult.grossEarnings,
        tips: parsedEmailResult.tips,
        bonusIncentives: parsedEmailResult.bonusIncentives,
        distanceTravelled: parsedEmailResult.distanceTravelled,
        fuelCost: parsedEmailResult.fuelCost,
        notes: `Imported via Email Statement Extraction for ${selectedPlatform}`
      });

      if (res.data.success) {
        toast.success('Successfully imported shift into history logs!');
        setParsedEmailResult(null);
        onImportComplete();
      } else {
        toast.error('Failed to import log.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to import shift.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-surface border border-border p-5 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Ingestion Setup</h3>
          
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Target Gig Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {platformsList.map((plat) => (
                <button
                  key={plat.id}
                  onClick={() => {
                    setSelectedPlatform(plat.id);
                    setParsedCsvRows([]);
                    setIsCsvPreviewing(false);
                    setParsedEmailResult(null);
                  }}
                  className={`px-3 py-2 text-left rounded-xl text-xs font-semibold border transition-all ${
                    selectedPlatform === plat.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-surface/50 text-text-secondary'
                  }`}
                >
                  {plat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Ingestion Channel</label>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubTab('csv')}
                className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'csv'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-surface/50 text-text-secondary'
                }`}
              >
                <FileText className="w-4 h-4" />
                CSV Statement
              </button>
              <button
                onClick={() => setActiveSubTab('email')}
                className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'email'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-surface/50 text-text-secondary'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Email Payouts
              </button>
            </div>
          </div>

          {/* Privacy Explicit Consent Statement */}
          <div className="bg-surface-card border border-border/80 rounded-xl p-3.5 space-y-3">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-primary">Compliance & Consent Declaration</h4>
                <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                  Scooter App handles imported files client-side. Payout emails are securely analyzed temporarily via server integrations and are never saved or shared with third parties.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
              />
              <span className="text-xs font-medium text-text-primary">
                I grant explicit consent to parse statement
              </span>
            </label>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-4 border border-border bg-surface/40 rounded-2xl flex gap-3 text-xs text-text-secondary">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block mb-0.5">Need a sample file?</span>
            Pasted statement lines should follow standard comma patterns. Ensure headers include: <strong className="text-text-primary">Date</strong>, <strong className="text-text-primary">Hours</strong>, <strong className="text-text-primary">Orders</strong>, and <strong className="text-text-primary">Earnings</strong>.
          </div>
        </div>
      </div>

      {/* Editor & Action Column */}
      <div className="lg:col-span-7 space-y-6">
        {activeSubTab === 'csv' ? (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-text-primary">CSV Statement Paste</h3>
                <p className="text-xs text-text-secondary mt-0.5">Paste comma-separated rows below to parse multiple shifts.</p>
              </div>
              <UploadCloud className="w-6 h-6 text-text-secondary" />
            </div>

            <textarea
              className="w-full h-44 p-4 font-mono text-xs border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-card text-text-primary"
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setParsedCsvRows([]);
                setIsCsvPreviewing(false);
              }}
              placeholder="Date,Hours,Orders,Earnings,Tips,Fuel"
              disabled={isCsvPreviewing}
            />

            {!isCsvPreviewing ? (
              <Button className="w-full py-2.5 font-semibold" onClick={handlePreviewCsv}>
                Preview Statement Rows
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface-card border-b border-border sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">Date</th>
                        <th className="p-2 font-semibold">Hours</th>
                        <th className="p-2 font-semibold">Orders</th>
                        <th className="p-2 font-semibold">Earnings</th>
                        <th className="p-2 font-semibold">Tips</th>
                        <th className="p-2 font-semibold">Fuel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedCsvRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface/30">
                          <td className="p-2 font-mono text-text-primary">{row.date}</td>
                          <td className="p-2">{row.hoursWorked} hrs</td>
                          <td className="p-2">{row.ordersCompleted} orders</td>
                          <td className="p-2 font-semibold">{formatCurrency(row.grossEarnings)}</td>
                          <td className="p-2 text-success">{formatCurrency(row.tips || 0)}</td>
                          <td className="p-2 text-error">{formatCurrency(row.fuelCost || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCsvPreviewing(false)}>
                    Edit Statement CSV
                  </Button>
                  <Button className="flex-1" onClick={handleImportCsv}>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Import Logs
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-text-primary">Email Report Text Ingestion</h3>
                <p className="text-xs text-text-secondary mt-0.5">Paste payout receipts, SMS confirmations, or weekly summaries.</p>
              </div>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <textarea
              className="w-full h-44 p-4 font-mono text-xs border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-card text-text-primary"
              value={emailText}
              onChange={(e) => {
                setEmailText(e.target.value);
                setParsedEmailResult(null);
              }}
              placeholder="Paste email or text message payout summary here..."
              disabled={isParsingEmail}
            />

            {!parsedEmailResult ? (
              <Button 
                className="w-full py-2.5 font-semibold" 
                onClick={handleParseEmail}
                disabled={isParsingEmail}
              >
                {isParsingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Statement text...
                  </>
                ) : 'Extract Statement metrics'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Extracted Shift Profile</h4>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {isAiParsed ? '🧠 Gemini AI extraction' : '⚡ Expression pattern matched'}
                      </p>
                    </div>
                    <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      Extracted
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Shift Date</span>
                      <strong className="text-xs font-mono text-text-primary">{parsedEmailResult.date}</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Hours Worked</span>
                      <strong className="text-xs text-text-primary">{parsedEmailResult.hoursWorked} hrs</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Orders Delivered</span>
                      <strong className="text-xs text-text-primary">{parsedEmailResult.ordersCompleted} trips</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Gross Payout</span>
                      <strong className="text-xs text-success">{formatCurrency(parsedEmailResult.grossEarnings)}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Customer Tips</span>
                      <strong className="text-xs text-text-primary">{formatCurrency(parsedEmailResult.tips || 0)}</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Incentives</span>
                      <strong className="text-xs text-text-primary">{formatCurrency(parsedEmailResult.bonusIncentives || 0)}</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Distance</span>
                      <strong className="text-xs text-text-primary">{parsedEmailResult.distanceTravelled || 0} km</strong>
                    </div>
                    <div className="bg-surface-card p-2 rounded border border-border/60">
                      <span className="text-[10px] text-text-secondary block">Fuel Cost</span>
                      <strong className="text-xs text-error">{formatCurrency(parsedEmailResult.fuelCost || 0)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setParsedEmailResult(null)}>
                    Discard
                  </Button>
                  <Button className="flex-1" onClick={handleImportParsedEmail}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Extracted Shift
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
