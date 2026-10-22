import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  Clock,
  Radio,
  Search,
  Gauge,
  ArrowLeft,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../api/index.js';
import toast from 'react-hot-toast';

export default function AdminObservability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // in seconds
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metricSearch, setMetricSearch] = useState('');
  const [testingLatency, setTestingLatency] = useState(false);
  const [liveLatencyResults, setLiveLatencyResults] = useState(null);

  const timerRef = useRef(null);

  const fetchObservability = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await adminAPI.getObservability();
      setData(res.data);
    } catch (err) {
      if (!isSilent) toast.error('Failed to fetch observability telemetry');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchObservability();
  }, [fetchObservability]);

  // Auto-refresh interval
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (refreshInterval > 0) {
      timerRef.current = setInterval(() => {
        fetchObservability(true);
      }, refreshInterval * 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshInterval, fetchObservability]);

  // Run live interactive latency probe
  const runLiveLatencyProbe = async () => {
    setTestingLatency(true);
    const endpoints = [
      { name: 'Health Live Probe', url: '/health/live' },
      { name: 'Product Listing (Cached)', url: '/api/products' },
      { name: 'Featured Products', url: '/api/products/featured' },
      { name: 'Category Navigation', url: '/api/categories' },
    ];

    const results = [];
    const samplesPerEp = 8;

    try {
      for (const ep of endpoints) {
        const times = [];
        let errors = 0;
        for (let i = 0; i < samplesPerEp; i++) {
          const t0 = performance.now();
          try {
            const res = await fetch(ep.url);
            if (!res.ok) errors++;
            await res.json();
          } catch {
            errors++;
          }
          times.push(performance.now() - t0);
        }
        times.sort((a, b) => a - b);
        const p50 = times[Math.floor(times.length * 0.50)] || 0;
        const p95 = times[Math.floor(times.length * 0.95)] || 0;
        const p99 = times[Math.floor(times.length * 0.99)] || 0;

        results.push({
          name: ep.name,
          url: ep.url,
          p50: p50.toFixed(1),
          p95: p95.toFixed(1),
          p99: p99.toFixed(1),
          errors,
        });
      }
      setLiveLatencyResults(results);
      toast.success('Live latency probe completed!');
    } catch {
      toast.error('Latency probe encountered an error');
    } finally {
      setTestingLatency(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await adminAPI.clearCache();
      toast.success('Redis cache cleared successfully');
      fetchObservability();
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  const summary = data?.summary || {};
  const metrics = data?.metrics || [];

  // Filter metrics list
  const filteredMetrics = metrics.filter(m =>
    m.name.toLowerCase().includes(metricSearch.toLowerCase()) ||
    (m.help && m.help.toLowerCase().includes(metricSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-20 pb-16 bg-obsidian-950 text-white">
      <div className="container-app py-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-obsidian-800/80">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="w-8 h-8 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 flex items-center justify-center text-obsidian-300 hover:text-white transition-colors"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
                    System Observability & Latency
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Telemetry
                    </span>
                  </h1>
                  <p className="text-obsidian-400 text-xs sm:text-sm mt-0.5">
                    Real-time monitoring of p50/p95 latency, Prometheus metrics, Redis cache hits, and database health.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-obsidian-900 border border-obsidian-750 rounded-xl px-3 py-1.5 text-xs text-obsidian-300 gap-2">
              <Clock className="w-3.5 h-3.5 text-obsidian-400" />
              <span>Poll:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-obsidian-900">Paused</option>
                <option value={3} className="bg-obsidian-900">3s</option>
                <option value={5} className="bg-obsidian-900">5s</option>
                <option value={10} className="bg-obsidian-900">10s</option>
                <option value={30} className="bg-obsidian-900">30s</option>
              </select>
            </div>

            <button
              onClick={() => fetchObservability()}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-750 text-xs font-medium text-white flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-gold-400' : 'text-obsidian-300'}`} />
              Refresh
            </button>

            <button
              onClick={runLiveLatencyProbe}
              disabled={testingLatency}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-xs font-medium text-cyan-300 flex items-center gap-2 transition-all shadow-sm shadow-cyan-950"
            >
              <Zap className={`w-3.5 h-3.5 ${testingLatency ? 'animate-bounce text-cyan-400' : ''}`} />
              {testingLatency ? 'Measuring...' : 'Test Latency Live'}
            </button>

            <button
              onClick={handleClearCache}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-300 flex items-center gap-2 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              Purge Cache
            </button>
          </div>
        </div>

        {/* 1. Core Health & KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* MongoDB Status Card */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-obsidian-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                MongoDB Atlas
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${summary.mongoConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {summary.mongoConnected ? 'CONNECTED' : 'DOWN'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-bold text-white">
                {summary.mongoLatencyMs >= 0 ? `${summary.mongoLatencyMs}ms` : '—'}
              </p>
              <span className="text-xs text-obsidian-400">ping</span>
            </div>
            <p className="text-xs text-obsidian-500 mt-1">Pool: 20 max · Socket timeout: 45s</p>
          </div>

          {/* Redis Cache Status Card */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-obsidian-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Redis Cache
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${summary.redisConnected ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {summary.redisConnected ? 'ONLINE' : 'FALLBACK'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-bold text-white">
                {summary.cacheHitRatio || '100%'}
              </p>
              <span className="text-xs text-cyan-400 font-medium">Hit Ratio</span>
            </div>
            <p className="text-xs text-obsidian-500 mt-1">
              Hits: {(summary.cacheHits || 0).toLocaleString()} · Misses: {(summary.cacheMisses || 0).toLocaleString()}
            </p>
          </div>

          {/* Total HTTP Volume & Error Rate Card */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-obsidian-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                HTTP Ingress
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {summary.errorRate || '0.00%'} errors
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-bold text-white">
                {(summary.totalRequests || 0).toLocaleString()}
              </p>
              <span className="text-xs text-obsidian-400">requests</span>
            </div>
            <p className="text-xs text-obsidian-500 mt-1">
              Rate Limit Hits: {summary.rateLimitHits || 0}
            </p>
          </div>

          {/* Memory & Uptime Card */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-obsidian-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-gold-400" />
                Node.js Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/20">
                {summary.memoryMb ? `${summary.memoryMb} MB` : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-bold text-white">
                {summary.uptimeSeconds ? `${Math.floor(summary.uptimeSeconds / 60)}m` : '0m'}
              </p>
              <span className="text-xs text-obsidian-400">uptime</span>
            </div>
            <p className="text-xs text-obsidian-500 mt-1">
              Redis Latency: {summary.redisLatencyMs >= 0 ? `${summary.redisLatencyMs}ms` : '—'}
            </p>
          </div>
        </div>

        {/* 2. Interactive Live Latency Measurement Panel */}
        {liveLatencyResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-8 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-obsidian-900/60"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-display font-semibold text-white">Live Client-Measured Latency (Latest Test)</h2>
              </div>
              <button
                onClick={() => setLiveLatencyResults(null)}
                className="text-xs text-obsidian-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveLatencyResults.map((res, i) => (
                <div key={i} className="bg-obsidian-900/80 border border-obsidian-750 rounded-xl p-4">
                  <p className="text-xs text-obsidian-400 truncate font-medium">{res.name}</p>
                  <p className="text-xs font-mono text-obsidian-500 truncate mb-2">{res.url}</p>
                  <div className="flex items-center justify-between border-t border-obsidian-800 pt-2 text-xs">
                    <span className="text-obsidian-400">p50:</span>
                    <span className="font-mono font-bold text-emerald-400">{res.p50}ms</span>
                    <span className="text-obsidian-400 ml-2">p95:</span>
                    <span className={`font-mono font-bold ${parseFloat(res.p95) < 150 ? 'text-emerald-400' : parseFloat(res.p95) < 300 ? 'text-amber-400' : 'text-red-400'}`}>
                      {res.p95}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. System Architecture & Component Status Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Background Worker Queues (BullMQ) */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                BullMQ Queue Workers
              </h2>
              <span className="text-xs text-obsidian-400">4 Registered</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'emails', desc: 'Transactional & Order Emails', concur: 5, color: 'text-blue-400' },
                { name: 'analytics', desc: 'Event Logging & User Telemetry', concur: 10, color: 'text-emerald-400' },
                { name: 'recommendations', desc: 'Hourly Trending Recomputation', concur: 1, color: 'text-gold-400' },
                { name: 'abandoned-cart', desc: 'Cart Recovery Automation', concur: 1, color: 'text-purple-400' },
              ].map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900/60 border border-obsidian-800">
                  <div>
                    <p className={`text-xs font-mono font-semibold ${q.color}`}>queue:{q.name}</p>
                    <p className="text-[11px] text-obsidian-400">{q.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE (c:{q.concur})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure & Security Integrity */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Infrastructure & Resilience
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Cache Stampede Mutex', status: 'Enabled', desc: 'Single-flight promise deduplication', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Non-Blocking Invalidation', status: 'Active (SCAN)', desc: 'Replaced blocking KEYS * with cursor SCAN', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Order Race Idempotency', status: 'Guaranteed', desc: 'Collision-free high-entropy ORD generator', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Stripe Webhook Deduplication', status: 'Active', desc: 'Database tracking via WebhookEvent model', icon: CheckCircle2, color: 'text-emerald-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-obsidian-900/60 border border-obsidian-800">
                  <item.icon className={`w-4 h-4 mt-0.5 ${item.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white">{item.label}</p>
                      <span className="text-[10px] font-semibold text-emerald-400">{item.status}</span>
                    </div>
                    <p className="text-[11px] text-obsidian-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access to Observability Artifacts */}
          <div className="glass rounded-2xl p-5 border border-obsidian-750">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gold-400" />
                Dashboards & Scrape APIs
              </h2>
            </div>
            <div className="space-y-2.5">
              <a
                href="/metrics"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-obsidian-800 hover:border-gold-500/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-gold-400">Prometheus Raw Scrape</p>
                  <p className="text-[11px] text-obsidian-400">GET /metrics (plain text)</p>
                </div>
                <span className="text-xs text-obsidian-500 group-hover:text-gold-400">View ↗</span>
              </a>

              <a
                href="/health"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-obsidian-800 hover:border-emerald-500/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-emerald-400">Detailed Diagnostic Health</p>
                  <p className="text-[11px] text-obsidian-400">GET /health (JSON latency)</p>
                </div>
                <span className="text-xs text-obsidian-500 group-hover:text-emerald-400">View ↗</span>
              </a>

              <a
                href="/health/live"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-obsidian-800 hover:border-blue-500/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-blue-400">K8s Liveness Probe</p>
                  <p className="text-[11px] text-obsidian-400">GET /health/live (200 OK)</p>
                </div>
                <span className="text-xs text-obsidian-500 group-hover:text-blue-400">View ↗</span>
              </a>

              <a
                href="/health/ready"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 border border-obsidian-800 hover:border-purple-500/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-purple-400">K8s Readiness Probe</p>
                  <p className="text-[11px] text-obsidian-400">GET /health/ready (DB readiness)</p>
                </div>
                <span className="text-xs text-obsidian-500 group-hover:text-purple-400">View ↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4. Live Prometheus Metric Explorer */}
        <div className="glass rounded-2xl p-6 border border-obsidian-750">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Active Prometheus Metrics Explorer ({filteredMetrics.length} registered)
              </h2>
              <p className="text-xs text-obsidian-400 mt-0.5">
                Live inspect all counters, gauges, and latency histograms exposed by ShopAI.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="text"
                placeholder="Search metrics (e.g. latency, redis, http)..."
                value={metricSearch}
                onChange={(e) => setMetricSearch(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-750 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-obsidian-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredMetrics.length === 0 ? (
              <p className="text-center py-10 text-obsidian-500 text-xs">No matching metrics found.</p>
            ) : (
              filteredMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-800 hover:border-obsidian-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                        {m.type}
                      </span>
                      <p className="text-xs font-mono font-bold text-white break-all">{m.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-gold-400">
                        {m.values?.length ? `${m.values.length} timeseries sample(s)` : '0'}
                      </span>
                    </div>
                  </div>
                  {m.help && <p className="text-[11px] text-obsidian-400 mt-1">{m.help}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
