import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Globe, AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MonitorData {
  status: 'no-change' | 'changed' | 'first-scan' | 'error';
  time: string;
  url: string;
  error?: string;
}

export default function App() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [history, setHistory] = useState<MonitorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to monitor server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from monitor server');
    });

    socket.on('update', (newData: MonitorData) => {
      setData(newData);
      setHistory((prev) => [newData, ...prev].slice(0, 10));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'changed': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'no-change': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'first-scan': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'error': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'changed': return <AlertCircle className="w-6 h-6" />;
      case 'no-change': return <CheckCircle className="w-6 h-6" />;
      case 'first-scan': return <Globe className="w-6 h-6" />;
      case 'error': return <AlertCircle className="w-6 h-6" />;
      default: return <RefreshCw className="w-6 h-6 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
              <Globe className="text-blue-500" />
              WebWatch  Fixed by Wat IDE - Pulled from main by 
            </h1>
            <p className="text-gray-400">Real-time website change detection dashboard</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </header>

        {/* Main Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group mb-8"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-8 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-xl border ${data ? getStatusColor(data.status) : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                  {data ? getStatusIcon(data.status) : <RefreshCw className="w-8 h-8 animate-spin" />}
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Current Status</h2>
                  <div className="text-2xl font-semibold text-white">
                    {!data ? 'Initializing Monitor...' : (
                      data.status === 'changed' ? '🚨 Website Changed!' :
                      data.status === 'no-change' ? '✅ No Changes Detected' :
                      data.status === 'first-scan' ? '📌 Baseline Established' :
                      `❌ Error: ${data.error}`
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Last check: {data?.time || '--:--:--'}
                </div>
                <a 
                  href={data?.url || 'https://example.com'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {data?.url || 'https://example.com'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* History Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-gray-500 italic">
                  Waiting for activity logs...
                </div>
              ) : (
                history.map((log, index) => (
                  <motion.div
                    key={`${log.time}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'changed' ? 'bg-red-500' :
                        log.status === 'no-change' ? 'bg-emerald-500' :
                        log.status === 'first-scan' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-200">
                        {log.status === 'changed' ? 'Change Detected' :
                         log.status === 'no-change' ? 'No Change' :
                         log.status === 'first-scan' ? 'Initial Scan' : 'Error'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">{log.time}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">
            Monitoring interval: 30 seconds • SHA-256 Hashing Enabled
          </p>
        </footer>
      </div>
    </div>
  );
}
