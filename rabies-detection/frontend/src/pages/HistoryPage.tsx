import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion} from 'framer-motion';
import { 
  Activity, 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  User,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { getHistory } from '../api/client';
import type { PredictionHistoryItem } from '../types';

const riskTheme = (level: string) => {
  if (level === 'High') return {
    textColor: 'text-crimson-500',
    bgColor: 'bg-crimson-500/10',
    borderColor: 'border-crimson-500/20',
    dot: 'bg-crimson-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
  };
  if (level === 'Medium') return {
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    dot: 'bg-orange-500'
  };
  return {
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    dot: 'bg-emerald-500'
  };
};

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter(h => 
    h.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    h.risk_level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen mesh-gradient text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-xl accent-gradient hover:shadow-glow transition-all"
            >
              <Activity className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold outfit tracking-tight">Record Archive</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Patient Longitudinal Database</span>
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl glass border border-white/5 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-crimson-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by name or risk level..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-crimson-500/50 focus:bg-white/10 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-4 rounded-2xl glass border border-white/5 text-sm font-bold text-slate-400 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
              <Filter className="w-4 h-4" /> Type <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex-1 md:flex-none px-6 py-4 rounded-2xl glass border border-white/5 text-sm font-bold text-slate-400 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
              <Calendar className="w-4 h-4" /> Date Range <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* History Records Table */}
        <div className="glass-card rounded-[32px] overflow-hidden border border-white/5">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-crimson-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Accessing Secure Records...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold outfit mb-2">No Records Detected</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-light mb-8">No patient assessments match your current filter parameters or the archive is empty.</p>
              <button 
                onClick={() => navigate('/assessment')}
                className="px-8 py-3 rounded-xl accent-gradient text-white font-bold text-sm shadow-glow"
              >
                Perform New Evaluation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Assessment ID</th>
                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Patient Identity</th>
                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Risk Classification</th>
                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Prob. Index</th>
                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-8 py-6 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-inter">
                  {filteredHistory.map((h, i) => {
                    const theme = riskTheme(h.risk_level);
                    return (
                      <motion.tr
                        key={h.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/result/${h.id}`)}
                        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="px-8 py-6">
                          <span className="font-mono text-xs text-slate-600 font-bold group-hover:text-slate-400 transition-colors">#{h.id.toString().padStart(4, '0')}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors uppercase">{h.patient_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${theme.bgColor} ${theme.borderColor}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${theme.textColor}`}>{h.risk_level}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${h.risk_level === 'High' ? 'bg-crimson-500' : h.risk_level === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${h.probability * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold outfit">{Math.round(h.probability * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 rounded-lg bg-white/5 text-slate-600 group-hover:bg-crimson-500 group-hover:text-white transition-all transform group-hover:scale-110">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 -mr-96 -mt-96 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -ml-96 -mb-96 w-[800px] h-[800px] bg-crimson-600/5 rounded-full blur-[150px] pointer-events-none" />
    </div>
  );
};

export default HistoryPage;
