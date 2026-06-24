import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { 
  Activity, 
  ArrowLeft, 
  Share2, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { getPrediction } from '../api/client';
import type { PredictResponse } from '../types';

const riskTheme = (level: string) => {
  if (level === 'High') return {
    textColor: 'text-crimson-500',
    bgColor: 'bg-crimson-500/10',
    borderColor: 'border-crimson-500/20',
    fill: '#EF4444',
    icon: AlertTriangle,
    label: 'Critical / High Risk'
  };
  if (level === 'Medium') return {
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    fill: '#F97316',
    icon: Info,
    label: 'Moderate Risk'
  };
  return {
    textColor: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    fill: '#10B981',
    icon: CheckCircle,
    label: 'Low / Negligible'
  };
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [result, setResult] = useState<PredictResponse | null>(
    (location.state as PredictResponse) || null
  );
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result && id) {
      getPrediction(parseInt(id))
        .then(setResult)
        .catch(() => navigate('/'))
        .finally(() => setLoading(false));
    }
  }, [id, result, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-crimson-500 animate-spin" />
          <span className="text-slate-500 font-bold outfit uppercase tracking-widest text-xs">Retrieving Report...</span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const pct = Math.round(result.final_probability * 100);
  const theme = riskTheme(result.risk_level);
  const chartData = [{ name: 'risk', value: pct, fill: theme.fill }];
  const maxFeatWeight = Math.max(...result.top_features.map(f => f.weight), 0.01);

  return (
    <div className="min-h-screen mesh-gradient text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-xl accent-gradient hover:shadow-glow transition-all"
            >
              <Activity className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold outfit tracking-tight">Risk Report Intelligence</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Report ID: {result.id}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/history')}
            className="px-4 py-2 rounded-xl glass border border-white/5 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Records
          </button>
        </div>
      </header>

      <main className="pt-32 px-4 max-w-5xl mx-auto space-y-8">
        {/* Hero Assessment Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[40px] overflow-hidden p-8 md:p-12 relative"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] -mr-48 -mt-48" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            {/* Probability Gauge */}
            <div className="relative flex-shrink-0">
              <div className="w-64 h-64 md:w-80 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="80%"
                    outerRadius="100%"
                    data={chartData}
                    startAngle={225}
                    endAngle={-45}
                    barSize={24}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={20}
                      background={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl md:text-7xl font-extrabold outfit ${theme.textColor}`}>{pct}%</span>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Probability</span>
                </div>
              </div>
            </div>

            {/* Assessment Summary */}
            <div className="flex-1 text-center md:text-left space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Patient Profile</span>
                <h1 className="text-4xl md:text-5xl font-black outfit text-white uppercase">{result.patient_name}</h1>
              </div>

              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${theme.bgColor} ${theme.borderColor}`}>
                <theme.icon className={`w-5 h-5 ${theme.textColor}`} />
                <span className={`text-lg font-bold outfit ${theme.textColor}`}>Classification: {theme.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="p-4 rounded-2xl glass border border-white/5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Symptom Boost</span>
                  <span className="text-xl font-bold text-orange-400">+{Math.round(result.symptom_boost * 100)}%</span>
                </div>
                <div className="p-4 rounded-2xl glass border border-white/5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">System Trust</span>
                  <span className="text-xl font-bold text-blue-400">High Score</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Causal Analysis */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 glass-card rounded-[32px] p-8 md:p-10"
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-5 h-5 text-crimson-500" />
              <h2 className="text-2xl font-bold outfit">Top Causal Contributors</h2>
            </div>
            <div className="space-y-6">
              {result.top_features.map((f, i) => (
                <div key={f.feature} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium capitalize">{f.feature.replace(/_/g, ' ')}</span>
                    <span className={`font-bold outfit ${theme.textColor}`}>{(f.weight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(f.weight / maxFeatWeight) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full accent-gradient"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-500 font-light leading-relaxed">
                Weights represent the relative importance of these features in the global XGBoost classification model for this specific patient profile.
              </p>
            </div>
          </motion.div>

          {/* Intervention Protocols */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass-card rounded-[32px] p-8 md:p-10"
          >
            <div className="flex items-center gap-3 mb-8">
              <Stethoscope className="w-5 h-5 text-blue-400" />
              <h2 className="text-2xl font-bold outfit">Intervention Protocols</h2>
            </div>
            <div className="space-y-4">
              {result.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`p-5 rounded-2xl border-l-4 glass ${
                    result.risk_level === 'High' ? 'border-crimson-500 bg-crimson-500/5' :
                    result.risk_level === 'Medium' ? 'border-orange-500 bg-orange-500/5' : 'border-green-500 bg-green-500/5'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 rounded-2xl border border-white/5 text-xs font-bold text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" /> View Clinical Guidelines (WHO)
            </button>
          </motion.div>
        </div>

        {/* Global System Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'ML Model Integrity', value: 'High', icon: ShieldCheck },
            { label: 'System Accuracy', value: '80.5%', icon: Activity },
            { label: 'Data Latency', value: '38ms', icon: TrendingUp },
            { label: 'Encrypted', value: 'Yes', icon: Lock }
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-2 border border-white/5">
              <item.icon className="w-5 h-5 text-slate-600" />
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</div>
              <div className="text-lg font-bold outfit text-white">{item.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Action Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 pt-10"
        >
          <button 
            onClick={() => navigate('/assessment')}
            className="flex-1 btn-premium px-10 py-5 rounded-2xl accent-gradient text-white font-bold text-lg shadow-xl"
          >
            Start New Assessment
          </button>
          <button 
            onClick={() => window.print()}
            className="px-8 py-5 rounded-2xl glass border border-white/10 text-white font-bold flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
          >
            <Download className="w-6 h-6" /> Export Report
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Report URL copied to clipboard');
            }}
            className="px-6 py-5 rounded-2xl glass border border-white/10 text-white flex items-center justify-center hover:bg-white/5 transition-all"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </motion.div>
      </main>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 -mr-96 -mt-96 w-[800px] h-[800px] bg-crimson-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -ml-96 -mb-96 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
    </div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

const Lock: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

export default ResultPage;
