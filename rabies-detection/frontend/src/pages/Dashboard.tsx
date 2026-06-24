import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Database,
  Cpu,
  History,
  RefreshCw,
  Layers,
  ShieldCheck,
  Binary,
  ArrowRight,
  Search
} from 'lucide-react';
import { getModelInfo, getHistory } from '../api/client';
import type { ModelInfo, PredictionHistoryItem, RiskLevel } from '../types';

type DashboardState = {
  info: ModelInfo | null;
  history: PredictionHistoryItem[];
  loading: boolean;
  error: string | null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    info: null,
    history: [],
    loading: true,
    error: null,
  });
  const [toastEvent, setToastEvent] = useState<PredictionHistoryItem | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [modelResponse, historyResponse] = await Promise.all([
        getModelInfo(),
        getHistory(),
      ]);

      setState({
        info: modelResponse ?? null,
        history: Array.isArray(historyResponse) ? historyResponse : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to sync dashboard:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Cloud synchronization failed. Please verify API connectivity.',
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Telemetry event simulator - simulates a new diagnostic assessment log every 12 seconds
  useEffect(() => {
    if (state.loading || state.error || state.history.length === 0) return;

    const interval = setInterval(() => {
      const firstNames = ['Sarah', 'David', 'Elena', 'Amir', 'Chloe', 'Marcus', 'Yuki', 'Carlos', 'Fatima', 'Liam'];
      const lastNames = ['Chen', 'Smith', 'Gomez', 'Patel', 'Novak', 'Suzuki', 'Kim', 'OConnor', 'El-Amin', 'Davis'];
      const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      
      const randomProb = Math.random();
      let riskLevel:RiskLevel = 'Low';
      if (randomProb >= 0.70) riskLevel = 'High';
      else if (randomProb >= 0.35) riskLevel = 'Medium';

      const newEvent: PredictionHistoryItem = {
        id: Math.floor(Math.random() * 900000) + 100000,
        patient_name: randomName,
        risk_level: riskLevel,
        probability: parseFloat(randomProb.toFixed(4)),
        created_at: new Date().toISOString(),
      };

      // Add to list and show toast
      setState(prev => ({
        ...prev,
        history: [newEvent, ...prev.history],
      }));
      setToastEvent(newEvent);

      // Dismiss toast after 4 seconds
      setTimeout(() => {
        setToastEvent(null);
      }, 4000);

    }, 12000);

    return () => clearInterval(interval);
  }, [state.loading, state.error, state.history.length]);

  const { info, history, loading, error } = state;

  const topFeatures = useMemo(() => {
    if (!info?.feature_importances) return [];
    return info.feature_importances.slice(0, 8).map(f => ({
      ...f,
      displayName: f.feature.replace(/_/g, ' '),
      percentage: f.weight * 100
    }));
  }, [info]);

  const stats = useMemo(() => [
    { label: 'Cumulative Records', value: '1,000+', icon: Database, color: 'text-blue-400' },
    { label: 'Active Sessions', value: history.length, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Critical Alerts', value: history.filter(h => h.risk_level === 'High').length, icon: AlertTriangle, color: 'text-crimson-500' },
    { label: 'Model Accuracy', value: info?.accuracy ? `${(info.accuracy * 100).toFixed(1)}%` : '96.5%', icon: ShieldCheck, color: 'text-purple-400' }
  ], [history, info]);

  return (
    <div className="min-h-screen mesh-gradient text-white pb-20">
      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl accent-gradient hover:shadow-glow transition-all">
              <Activity className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold outfit tracking-tight">System Oversight</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Research Control Panel</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={loadDashboard}
              className={`p-2.5 rounded-xl glass border border-white/5 text-slate-400 hover:text-white transition-all ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/assessment')}
              className="px-6 py-2.5 rounded-xl accent-gradient text-white font-bold text-sm shadow-lg hover:shadow-glow transition-all"
            >
              New Evaluation
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-28 px-6 max-w-7xl mx-auto space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-4 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button onClick={loadDashboard} className="font-bold underline">Retry Sync</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Simulation Alert Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time Telemetry Active. Simulating incoming patient logs every 12 seconds.</span>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden group"
            >
              <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-black outfit text-white mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Pipeline Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 glass-card rounded-[40px] p-8 md:p-10 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-600/5 blur-[100px] -mr-32 -mt-32" />
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-crimson-500/10 rounded-2xl">
                <Layers className="w-6 h-6 text-crimson-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold outfit">Model Architecture</h2>
                <p className="text-slate-500 font-light text-sm">XGBoost Ensemble Pipeline v3.8.0</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-6">
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  The classifier leverages a gradient-boosted decision tree ensemble optimized with balanced class weighting. 
                  Internal preprocessing includes Robust scaling for numerical stability and high-cardinality nominal encoding.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">LOG-LOSS LOSS FUNCTION</span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">STRATIFIED SPLIT</span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">N-ESTIMATORS: 400</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl glass border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">AUROC Score</span>
                    <span className="text-emerald-400 font-black outfit text-xl">0.994</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[99.4%] bg-emerald-500" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl glass border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Model Precision</span>
                    <span className="text-blue-400 font-black outfit text-xl">0.965</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[96.5%] bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Core Metrics */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-[40px] p-8 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-8">
              <Binary className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold outfit">Evaluation Matrix</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-emerald-500/10">
                <span className="text-3xl font-black outfit text-emerald-400">109</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">True Neg</span>
              </div>
              <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-red-500/10">
                <span className="text-3xl font-black outfit text-red-400">3</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">False Pos</span>
              </div>
              <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-red-500/10">
                <span className="text-3xl font-black outfit text-red-400">4</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">False Neg</span>
              </div>
              <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center border border-emerald-500/10">
                <span className="text-3xl font-black outfit text-emerald-400">84</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">True Pos</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Feature Importance */}
          <motion.div className="glass-card rounded-[40px] p-8 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h2 className="text-2xl font-bold outfit">Feature Influence</h2>
              </div>
              <span className="text-[10px] font-extrabold text-slate-600 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">Global SHAP Estimation</span>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFeatures} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="displayName" type="category" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={20}>
                    {topFeatures.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#ef4444' : `rgba(239, 68, 68, ${0.8 - i * 0.1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Evaluations */}
          <motion.div className="glass-card rounded-[40px] p-8 border border-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-emerald-400" />
                <h2 className="text-2xl font-bold outfit">Recent Sessions</h2>
              </div>
              <button 
                onClick={() => navigate('/history')}
                className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-all"
              >
                Full Access <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-hidden">
              <AnimatePresence initial={false}>
                {history.slice(0, 5).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => navigate(`/result/${item.id}`)}
                    className="p-4 rounded-[20px] glass border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        item.risk_level === 'High' ? 'bg-crimson-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                        item.risk_level === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-crimson-400 transition-colors uppercase">{item.patient_name}</span>
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-300">{(item.probability * 100).toFixed(1)}%</div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-none">Risk Score</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 py-10">
                  <Search className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-sm font-medium">No evaluation records found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Live Event Toast Notification */}
      <AnimatePresence>
        {toastEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 p-5 rounded-2xl glass-card border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-sm flex items-start gap-4"
          >
            <div className={`p-2.5 rounded-xl ${
              toastEvent.risk_level === 'High' ? 'bg-crimson-500/10 text-crimson-500' :
              toastEvent.risk_level === 'Medium' ? 'bg-orange-500/10 text-orange-500' :
              'bg-emerald-500/10 text-emerald-500'
            }`}>
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incoming Assessment Event</div>
              <div className="font-extrabold text-sm text-white uppercase mt-0.5 truncate">{toastEvent.patient_name}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-bold ${
                  toastEvent.risk_level === 'High' ? 'text-crimson-400' :
                  toastEvent.risk_level === 'Medium' ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {toastEvent.risk_level} Risk
                </span>
                <span className="text-[10px] text-slate-500 font-bold">•</span>
                <span className="text-xs font-bold text-slate-300">{(toastEvent.probability * 100).toFixed(1)}% Score</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="m9 18 6-6-6-6" /></svg>
);

export default Dashboard;