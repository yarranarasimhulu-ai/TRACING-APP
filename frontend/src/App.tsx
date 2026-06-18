
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LabelList
} from 'recharts';
import {
  Activity,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Loader2,
  Database,
  Terminal,
  Cpu,
  Layers,
  Box,
  Braces,
  Zap,
  Clock,
  Coins,
  Filter,
  ArrowRightLeft,
  LayoutDashboard,
  Bug,
  MoreVertical,
  Trash2,
  Key,
  Copy,
  Network,
  Sun,
  Moon,
  Minus,
  Maximize,
  BarChart3,
  MessageSquare,
  Wrench,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import { fetchProjects, fetchRuns, fetchTrace, createProject, deleteProject, fetchApiKeys, createApiKey } from './api';
import type { Project, Run, ApiKey } from './api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className={cn(
      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
      isSuccess ? "bg-green-500/10 text-green-600 border border-green-500/20" : 
      isError ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
      "bg-blue-500/10 text-blue-600 border border-blue-500/20",
      className
    )}>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        isSuccess ? "bg-green-500" : isError ? "bg-red-500" : "bg-blue-500 animate-pulse"
      )} />
      {status}
    </div>
  );
}

function RunTypeIcon({ type, className }: { type: string; className?: string }) {
  const props = { className: cn("w-3.5 h-3.5", className) };
  switch (type) {
    case 'chain': return <Layers {...props} />;
    case 'llm': return <Cpu {...props} />;
    case 'tool': return <Terminal {...props} />;
    case 'agent': return <Activity {...props} />;
    default: return <Box {...props} />;
  }
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={cn(
      "fixed bottom-8 right-8 z-[1000] px-6 py-3 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-2xl shadow-[10px_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold transition-all duration-300",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    )}>
      {message}
    </div>
  );
}

function CreateProjectModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (name: string) => void }) {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = () => {
    if (projectName.trim()) {
      onSubmit(projectName);
      setProjectName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black tracking-tight dark:text-white uppercase italic">New Project</h2>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="My Agent Project"
              autoFocus
              className="w-full px-4 py-3 bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!projectName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ isOpen, onClose, projectName, onConfirm }: { isOpen: boolean; onClose: () => void; projectName: string; onConfirm: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black tracking-tight dark:text-white uppercase italic text-red-600">Delete Project?</h2>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold">"{projectName}"</span> and all its traces? This cannot be undone.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineBar({ start, end, totalStart, totalEnd, status }: { start: string, end: string | null, totalStart: number, totalEnd: number, status: string }) {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const duration = totalEnd - totalStart;

  const left = ((startTime - totalStart) / duration) * 100;
  const width = Math.max(((endTime - startTime) / duration) * 100, 0.5);

  return (
    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full relative w-full overflow-hidden">
      <div 
        className={cn(
          "absolute h-full rounded-full transition-all duration-500",
          status === 'success' ? "bg-green-500" : status === 'error' ? "bg-red-500" : "bg-blue-500 animate-pulse"
        )}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    </div>
  );
}

function HierarchicalRow({ 
  run, 
  depth, 
  selectedId, 
  onSelect,
  totalStart,
  totalEnd,
  expandedIds,
  toggleExpand
}: { 
  run: Run; 
  depth: number; 
  selectedId: string; 
  onSelect: (run: Run) => void;
  totalStart: number;
  totalEnd: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = run.children && run.children.length > 0;
  const isExpanded = expandedIds.has(run.id);
  
  const duration = run.end_time 
    ? (new Date(run.end_time).getTime() - new Date(run.start_time).getTime()) 
    : null;

  const totalTokens = run.outputs?.llm_output?.token_usage?.total_tokens || 0;

  return (
    <>
      <div 
        className={cn(
          "group flex items-center py-3 px-4 cursor-pointer border-b border-slate-50 dark:border-slate-800 transition-all",
          selectedId === run.id ? "bg-blue-50/80 dark:bg-blue-900/20 sticky top-0 bottom-0 z-10 shadow-sm" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
        )}
        onClick={() => onSelect(run)}
      >
        <div className="flex items-center gap-2 min-w-[300px] flex-1" style={{ paddingLeft: `${depth * 1.5}rem` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(run.id); }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
              </button>
            ) : <div className="w-6" />}
            <div className={cn(
              "p-1.5 rounded-md",
              selectedId === run.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}>
              <RunTypeIcon type={run.run_type} />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn("text-sm font-bold truncate", selectedId === run.id ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-100")}>
              {run.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{run.id.split('-')[0]}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 px-4 text-xs font-medium">
          <div className="w-20 flex flex-col items-end">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Clock size={10} />
              <span className="text-[9px] uppercase font-bold tracking-widest">Latency</span>
            </div>
            <span className="text-slate-700 dark:text-slate-300 font-mono">{duration ? `${duration}ms` : '—'}</span>
          </div>

          <div className="w-20 flex flex-col items-end">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Coins size={10} />
              <span className="text-[9px] uppercase font-bold tracking-widest">Cost</span>
            </div>
            <span className={cn("font-mono", totalTokens > 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400")}>
              {totalTokens > 0 ? `${totalTokens}tk` : '—'}
            </span>
          </div>
          
          <div className="w-24">
            <StatusBadge status={run.status} />
          </div>

          <div className="w-48 hidden lg:block">
            <TimelineBar 
              start={run.start_time} 
              end={run.end_time} 
              totalStart={totalStart} 
              totalEnd={totalEnd} 
              status={run.status} 
            />
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="bg-slate-50/30 dark:bg-slate-900/30">
          {run.children!.map(child => (
            <HierarchicalRow 
              key={child.id} 
              run={child} 
              depth={depth + 1} 
              selectedId={selectedId} 
              onSelect={onSelect}
              totalStart={totalStart}
              totalEnd={totalEnd}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </>
  );
}

function GraphNode({ node, activeId, onSelect }: { node: Run, activeId: string | null, onSelect: (id: string) => void }) {
  const hasChildren = node.children && node.children.length > 0;

  const getNodeStyles = (type: string) => {
    switch (type) {
      case 'llm':
        return activeId === node.id
          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/30 shadow-blue-500/20"
          : "border-blue-500 bg-blue-50 dark:bg-blue-950/20 hover:border-blue-600";
      case 'tool':
        return activeId === node.id
          ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/30 shadow-amber-500/20"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/20 hover:border-amber-600";
      case 'agent':
        return activeId === node.id
          ? "border-green-600 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/30 shadow-green-500/20"
          : "border-green-500 bg-green-50 dark:bg-green-950/20 hover:border-green-600";
      default:
        return activeId === node.id
          ? "border-slate-500 bg-slate-100 dark:bg-slate-800/30 ring-2 ring-slate-500/30 shadow-slate-500/20"
          : "border-slate-400 bg-slate-50 dark:bg-slate-900/20 hover:border-slate-500";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => onSelect(node.id)}
        className={cn(
          "px-4 py-2 border-2 rounded-xl shadow-sm cursor-pointer transition-all w-48 text-center",
          getNodeStyles(node.run_type),
          activeId === node.id && "scale-105"
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-1 text-slate-500">
           <RunTypeIcon type={node.run_type} />
           <span className="text-[9px] font-black uppercase tracking-widest">{node.run_type}</span>
        </div>
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{node.name}</div>
      </div>
      {hasChildren && (
        <>
          <div className="w-px h-6 bg-slate-300" />
          <div className="flex gap-4">
            {node.children!.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center relative">
                 {/* Top connector lines for siblings */}
                 {node.children!.length > 1 && (
                    <div className={cn("absolute top-0 h-px bg-slate-300", 
                       idx === 0 ? "left-1/2 right-0" : 
                       idx === node.children!.length - 1 ? "left-0 right-1/2" : 
                       "left-0 right-0"
                    )} />
                 )}
                 {node.children!.length > 1 && <div className="w-px h-6 bg-slate-300" />}
                 <GraphNode node={child} activeId={activeId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ApiKeyModal({
  isOpen,
  onClose,
  project,
  apiKeys,
  onGenerate,
  onShowToast
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  apiKeys: ApiKey[];
  onGenerate: () => void;
  onShowToast?: (message: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight dark:text-white uppercase italic">API Keys</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{project?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Keys</span>
              <button 
                onClick={onGenerate}
                className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
              >
                + Generate New Key
              </button>
            </div>
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl group">
                  <code className="text-sm font-mono text-slate-600 dark:text-slate-300">
                    {k.key.substring(0, 8)}************************
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(k.key);
                      if (navigator.clipboard && onShowToast) {
                        onShowToast("API Key copied!");
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ))}
              {apiKeys.length === 0 && (
                <div className="py-8 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No API keys generated yet.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
             <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 mb-2">
               <Zap size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Integration Tip</span>
             </div>
             <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed font-medium">
               Use these keys in your `LocalTracer` initialization to authorize trace ingestion for this project.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JsonView({ data, depth = 0 }: { data: any, depth?: number }) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 1);
  
  if (data === null) return <span className="text-blue-400">null</span>;
  if (typeof data === 'string') return <span className="text-green-400">"{data}"</span>;
  if (typeof data === 'number') return <span className="text-orange-400">{data}</span>;
  if (typeof data === 'boolean') return <span className="text-purple-400">{String(data)}</span>;
  
  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  
  if (keys.length === 0) return <span className="text-slate-500">{isArray ? '[]' : '{}'}</span>;

  return (
    <div className="font-mono text-sm">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hover:bg-white/10 rounded px-1 -ml-1 transition-colors text-slate-500 inline-flex items-center gap-1"
      >
        <span className="w-3 h-3 flex items-center justify-center border border-slate-700 rounded-[2px] text-[8px]">
          {isCollapsed ? '+' : '-'}
        </span>
        <span className="text-slate-400">{isArray ? '[' : '{'}</span>
      </button>
      
      {!isCollapsed && (
        <div className="ml-4 border-l border-slate-800/50 pl-4">
          {keys.map((key, i) => (
            <div key={key} className="flex flex-wrap gap-x-2">
              {!isArray && <span className="text-slate-400">"{key}":</span>}
              <JsonView data={data[key]} depth={depth + 1} />
              {i < keys.length - 1 && <span className="text-slate-600">,</span>}
            </div>
          ))}
        </div>
      )}
      
      {isCollapsed && <span className="text-slate-600 italic text-[10px] ml-2">... {keys.length} items ...</span>}
      <div className="text-slate-400">{isArray ? ']' : '}'}</div>
    </div>
  );
}

function AnalyticsDashboard({ runs }: { runs: Run[] }) {
  const chartData = useMemo(() => {
    // 1. Latency & Tokens over time (Daily)
    const daily: Record<string, { date: string, latency: number, tokens: number, count: number }> = {};
    const modelUsage: Record<string, number> = {};
    const statusCounts = { success: 0, error: 0, running: 0 };
    const toolStats: Record<string, { count: number, totalLatency: number }> = {};

    runs.forEach(run => {
      const date = new Date(run.start_time).toLocaleDateString();
      const latency = run.end_time ? (new Date(run.end_time).getTime() - new Date(run.start_time).getTime()) : 0;
      const tokens = run.outputs?.llm_output?.token_usage?.total_tokens || 0;
      
      if (!daily[date]) daily[date] = { date, latency: 0, tokens: 0, count: 0 };
      daily[date].latency += latency;
      daily[date].tokens += tokens;
      daily[date].count += 1;

      if (run.run_type === 'llm') {
        const model = run.inputs?.model || 'Unknown';
        modelUsage[model] = (modelUsage[model] || 0) + tokens;
      }

      if (run.run_type === 'tool') {
        const toolName = run.name || 'Unknown Tool';
        if (!toolStats[toolName]) toolStats[toolName] = { count: 0, totalLatency: 0 };
        toolStats[toolName].count += 1;
        toolStats[toolName].totalLatency += latency;
      }

      statusCounts[run.status as keyof typeof statusCounts]++;
    });

    const timeSeries = Object.values(daily).map(d => ({
      ...d,
      latency: Math.round(d.latency / d.count)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const modelPie = Object.entries(modelUsage).map(([name, value]) => ({ name, value }));
    const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    
    const topTools = Object.entries(toolStats)
      .map(([name, stats]) => ({ name, count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    const toolLatency = Object.entries(toolStats)
      .map(([name, stats]) => ({ name, avgLatency: Math.round(stats.totalLatency / stats.count) }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 5);

    return { timeSeries, modelPie, statusPie, topTools, toolLatency };
  }, [runs]);

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="p-10 space-y-8 overflow-y-auto h-full bg-transparent flex-1">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Latency Chart */}
        <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] relative overflow-hidden group">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
             <Clock size={18} className="text-blue-500" strokeWidth={3} /> Avg Latency over time (ms)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.timeSeries} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '1.5rem', color: '#0f172a', boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={6} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 4, stroke: '#f1f5f9' }} activeDot={{ r: 10, strokeWidth: 0, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Usage Chart */}
        <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Coins size={16} className="text-indigo-500" /> Token consumption by Model
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.modelPie}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="url(#colorBlue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tools by Usage */}
        <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] relative overflow-hidden group">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" strokeWidth={3} /> Top Tools by Usage (Count)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.topTools} layout="vertical" margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '1.5rem', color: '#0f172a', boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[16, 16, 16, 16]} barSize={32}>
                  <LabelList dataKey="count" position="right" fill="#64748b" fontSize={12} fontWeight="black" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Tool Latency */}
        <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] relative overflow-hidden group">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <Clock size={18} className="text-rose-500" strokeWidth={3} /> Average Tool Latency (ms)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.toolLatency} layout="vertical" margin={{ top: 20, right: 60, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '1.5rem', color: '#0f172a', boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                />
                <Bar dataKey="avgLatency" fill="#f43f5e" radius={[16, 16, 16, 16]} barSize={32}>
                  <LabelList dataKey="avgLatency" position="right" fill="#64748b" fontSize={12} fontWeight="black" formatter={(v: any) => `${v}ms`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] relative overflow-hidden group xl:col-span-2">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center justify-center gap-2">
             <Activity size={18} className="text-amber-500" strokeWidth={3} /> Success vs Error Rate
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusPie}
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {chartData.statusPie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '1.5rem', color: '#0f172a', boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}
                   itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowView({ run }: { run: Run | null }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);

  if (!run) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
        <Network size={64} className="mb-4 text-blue-500/50" />
        <h3 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-2">No Workflow Selected</h3>
        <p className="text-sm">Run your agent to generate a trace, then select the project to view its total workflow.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-slate-950 cursor-grab active:cursor-grabbing"
      onMouseDown={() => { isPanning.current = true; }}
      onMouseMove={(e) => {
        if (isPanning.current) {
          setPos(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
      }}
      onMouseUp={() => { isPanning.current = false; }}
      onMouseLeave={() => { isPanning.current = false; }}
      onWheel={(e) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.2, Math.min(prev * delta, 3)));
      }}
    >
      {/* Map Content */}
      <div 
        className="absolute origin-center transition-transform duration-75 min-w-[3000px] min-h-[3000px] flex items-center justify-center"
        style={{ 
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          left: '50%',
          top: '50%',
          marginLeft: '-1500px',
          marginTop: '-1500px'
        }}
      >
        <GraphNode node={run} activeId={null} onSelect={() => {}} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-50">
         <div className="bg-[#f1f5f9] dark:bg-[#1e293b] p-2 rounded-2xl shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] flex flex-col gap-2">
           <button 
             onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}
             className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-blue-500 transition-colors"
           >
             <Plus size={20} strokeWidth={2.5} />
           </button>
           <button 
             onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}
             className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-blue-500 transition-colors"
           >
             <Maximize size={20} strokeWidth={2.5} />
           </button>
           <button 
             onClick={() => setScale(prev => Math.max(prev * 0.8, 0.2))}
             className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-blue-500 transition-colors"
           >
             <Minus size={20} strokeWidth={2.5} />
           </button>
         </div>
      </div>
      
      {/* Workflow Legend */}
      <div className="absolute top-10 left-10 bg-[#f1f5f9] dark:bg-[#1e293b] p-6 rounded-3xl shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] z-50 pointer-events-none">
         <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
           <Network size={16} className="text-blue-500" /> Total Workflow
         </h2>
         <div className="space-y-3">
           <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-blue-500" />
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Agent Logic (LLM)</span>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-amber-500" />
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Tool Execution</span>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-slate-400" />
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Chain / Sub-Task</span>
           </div>
         </div>
      </div>
    </div>
  );
}

function buildSystemPrompt(project: Project, runs: Run[]): string {
  const rootRuns = runs.filter(r => !r.parent_run_id);
  const successCount = rootRuns.filter(r => r.status === 'success').length;
  const errorCount = rootRuns.filter(r => r.status === 'error').length;
  const errorRate = rootRuns.length > 0 ? Math.round((errorCount / rootRuns.length) * 100) : 0;

  let totalLatency = 0;
  let latencyCount = 0;
  let totalTokens = 0;

  runs.forEach(run => {
    if (run.end_time) {
      const latency = new Date(run.end_time).getTime() - new Date(run.start_time).getTime();
      totalLatency += latency;
      latencyCount += 1;
    }
    const tokens = run.outputs?.llm_output?.token_usage?.total_tokens || 0;
    totalTokens += tokens;
  });

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  const errors = runs.filter(r => r.error).slice(0, 5).map(r => r.error);

  const toolStats: Record<string, number> = {};
  runs.filter(r => r.run_type === 'tool').forEach(run => {
    const name = run.name || 'Unknown';
    toolStats[name] = (toolStats[name] || 0) + 1;
  });

  const toolStatsStr = Object.entries(toolStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `- ${name}: ${count} calls`)
    .join('\n');

  return `You are an expert AI assistant for a LangChain agent tracing dashboard.
Analyze the performance data below and give specific, actionable suggestions.

Project: ${project.name}
Total Traces: ${rootRuns.length}
Success: ${successCount} | Errors: ${errorCount} (${errorRate}% error rate)
Avg Latency: ${avgLatency}ms
Total Tokens Used: ${totalTokens}

${errors.length > 0 ? `Recent Errors:\n${errors.map(e => `- ${e}`).join('\n')}\n` : ''}
${toolStatsStr ? `Top Tools Used:\n${toolStatsStr}\n` : ''}

Be concise. Format key points as bullet points. Always give specific next steps.`;
}

async function callOpenRouterStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not found in .env');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LangChain Tracer'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines[lines.length - 1];

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  decoder.decode();
}

function ChatPanel({
  isOpen,
  onClose,
  selectedProject,
  runs,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  setChatLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedProject: Project | null;
  runs: Run[];
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  setChatMessages: (msgs: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const suggestedPrompts = [
    { text: 'Summarize performance overview', icon: BarChart3 },
    { text: "What's causing errors?", icon: Bug },
    { text: 'Which tools are slowest?', icon: Clock },
    { text: 'How to reduce latency?', icon: Zap }
  ];

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
  };

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !selectedProject) return;

    isAtBottomRef.current = true;
    const userMsg = { role: 'user' as const, content: message };
    const newMessages = [...chatMessages, userMsg];
    const aiMsg = { role: 'assistant' as const, content: '' };

    setChatMessages([...newMessages, aiMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(selectedProject, runs);
      let fullResponse = '';

      await callOpenRouterStream(newMessages, systemPrompt, (chunk: string) => {
        fullResponse += chunk;
        setChatMessages([...newMessages, { role: 'assistant', content: fullResponse }]);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
      setChatMessages([...newMessages, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const lastMsg = chatMessages[chatMessages.length - 1];
  const isThinking = chatLoading && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-[420px] z-[60] bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.4)] transition-transform duration-300",
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between shrink-0 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white">
            <Sparkles size={20} strokeWidth={2} fill="white" />
          </div>
          <div>
            <div className="font-black text-white uppercase italic tracking-tight text-sm">AI Assistant</div>
            <div className="text-[10px] text-white/80 font-medium">{selectedProject?.name}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-xl transition-all text-white hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages or Empty State */}
      <div
        className="flex-1 overflow-y-auto chat-scroll p-6 space-y-5 flex flex-col"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 py-8">
            {/* Hero Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full w-20 h-20" />
              <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
                <Sparkles size={32} strokeWidth={1.5} fill="white" />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Ask me anything</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get insights about your agent traces</p>
            </div>

            {/* 2x2 Suggestion Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {suggestedPrompts.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  onClick={() => handleSendMessage(text)}
                  disabled={chatLoading}
                  className="flex flex-col items-center gap-2 px-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-center font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon size={20} className="text-blue-500" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 flex flex-col">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <Sparkles size={14} className="text-white" strokeWidth={2} fill="white" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none shadow-[0_4px_14px_rgba(59,130,246,0.3)]'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm'
                  )}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-1" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-base font-black mt-3 mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xs font-bold mt-1 mb-0.5" {...props} />,
                        a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 underline hover:no-underline" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-white" strokeWidth={2} fill="white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Analyzing traces...</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              </div>
            )}

            {chatLoading && !isThinking && lastMsg?.role === 'assistant' && (
              <div className="flex justify-start items-start gap-3">
                <span className="text-xs text-slate-400 font-mono mt-2 ml-1">
                  <span className="animate-pulse">|</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0 space-y-3 bg-white dark:bg-slate-800/50">
        <div className="flex gap-2 items-end">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !chatLoading) {
                e.preventDefault();
                handleSendMessage(chatInput);
              }
            }}
            placeholder="Ask about your traces..."
            disabled={chatLoading}
            className="flex-1 px-4 py-2.5 bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.03),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]"
            rows={2}
          />
          <button
            onClick={() => handleSendMessage(chatInput)}
            disabled={!chatInput.trim() || chatLoading}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-[10px] text-slate-400 font-medium px-2">
          Enter to send • Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}

function ToolsView({ runs }: { runs: Run[] }) {
  const toolStats = useMemo(() => {
    const stats: Record<string, { count: number, errors: number, totalLatency: number, lastCalled: number }> = {};
    runs.filter(r => r.run_type === 'tool').forEach(run => {
      const name = run.name || 'Unknown Tool';
      const latency = run.end_time ? (new Date(run.end_time).getTime() - new Date(run.start_time).getTime()) : 0;
      const isError = run.status === 'error';
      const time = new Date(run.start_time).getTime();

      if (!stats[name]) stats[name] = { count: 0, errors: 0, totalLatency: 0, lastCalled: 0 };
      stats[name].count += 1;
      stats[name].totalLatency += latency;
      if (isError) stats[name].errors += 1;
      if (time > stats[name].lastCalled) stats[name].lastCalled = time;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      avgLatency: Math.round(data.totalLatency / data.count),
      successRate: Math.round(((data.count - data.errors) / data.count) * 100)
    })).sort((a, b) => b.lastCalled - a.lastCalled);
  }, [runs]);

  if (toolStats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-transparent">
        <Wrench size={64} className="mb-4 text-amber-500/50" />
        <h3 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-2">No Tools Invoked</h3>
        <p className="text-sm">This agent hasn't called any tools yet in this project.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-10 bg-transparent">
      <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest italic flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl shadow-[4px_4px_10px_rgba(245,158,11,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_5px_rgba(255,255,255,0.4)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_5px_rgba(255,255,255,0.2)]">
            <Wrench size={20} className="text-white" strokeWidth={2.5} />
          </div>
          Invoked Tools Library
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {toolStats.map(tool => (
            <div key={tool.name} className="bg-[#f1f5f9] dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.02)_inset] flex flex-col gap-4 transition-all hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#e2e8f0] dark:bg-[#0f172a] rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]">
                    <Terminal size={18} className="text-amber-600 dark:text-amber-500" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate max-w-[150px]" title={tool.name}>{tool.name}</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg">
                  {tool.count} calls
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Latency</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{tool.avgLatency}ms</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</span>
                  <span className={cn("font-mono font-bold", tool.successRate >= 90 ? "text-green-500" : tool.successRate >= 70 ? "text-amber-500" : "text-red-500")}>
                    {tool.successRate}%
                  </span>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Invoked</span>
                 <span className="text-xs font-medium text-slate-500">{new Date(tool.lastCalled).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [mainView, setMainView] = useState<'traces' | 'analytics' | 'workflow' | 'tools'>('traces');

  // The root trace currently being viewed
  const [selectedTrace, setSelectedTrace] = useState<Run | null>(null);
  // The full tree of the selected trace
  const [traceTree, setTraceTree] = useState<Run | null>(null);
  // The specific span being inspected within the trace
  const [activeSpanId, setActiveSpanId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    run_type: '',
    min_latency: '',
    tags: '',
    start_date: '',
    end_date: ''
  });

  // New states for API Keys and View Mode
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'graph' | 'transcript'>('tree');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Modal and Toast States
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Chat States
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Graph States
  const [graphScale, setGraphScale] = useState(1);
  const [graphPos, setGraphPos] = useState({ x: 0, y: 0 });
  const isPanningGraph = useRef(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search traces..."]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resizable Panel States
  const [detailWidth, setDetailWidth] = useState(800);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizingDetail = useRef(false);
  const isResizingSidebar = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingDetail.current) {
        const newWidth = window.innerWidth - e.clientX;
        setDetailWidth(Math.max(400, Math.min(newWidth, window.innerWidth - 400)));
      }
      if (isResizingSidebar.current) {
        const detailStart = window.innerWidth - detailWidth;
        const newSidebarWidth = e.clientX - detailStart;
        setSidebarWidth(Math.max(200, Math.min(newSidebarWidth, detailWidth - 300)));
      }
    };
    const handleMouseUp = () => {
      isResizingDetail.current = false;
      isResizingSidebar.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [detailWidth]);

  const runsPollingRef = useRef<number | null>(null);
  const tracePollingRef = useRef<number | null>(null);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      if (data.length > 0 && !selectedProject) setSelectedProject(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedProject && isLive) {
      const poll = () => fetchRuns(selectedProject.id, {
        status: filters.status || undefined,
        run_type: filters.run_type || undefined,
        min_latency: filters.min_latency ? parseInt(filters.min_latency) : undefined,
        tags: filters.tags || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined
      }).then(setRuns);
      poll();
      runsPollingRef.current = window.setInterval(poll, 3000);
    } else {
      if (runsPollingRef.current) clearInterval(runsPollingRef.current);
    }
    return () => { if (runsPollingRef.current) clearInterval(runsPollingRef.current); };
  }, [selectedProject?.id, isLive, filters]);

  useEffect(() => {
    if (selectedTrace && isLive && (selectedTrace.status === 'running')) {
      const poll = () => fetchTrace(selectedTrace.id).then(setTraceTree);
      poll();
      tracePollingRef.current = window.setInterval(poll, 2000);
    } else {
      if (tracePollingRef.current) clearInterval(tracePollingRef.current);
      if (selectedTrace) fetchTrace(selectedTrace.id).then(setTraceTree);
    }
    return () => { if (tracePollingRef.current) clearInterval(tracePollingRef.current); };
  }, [selectedTrace?.id, selectedTrace?.status, isLive]);

  // Root runs only (parents) for the main table
  const rootRuns = useMemo(() => {
    const roots = runs.filter(r => !r.parent_run_id);
    if (!searchQuery) return roots;
    return roots.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [runs, searchQuery]);

  const { totalStart, totalEnd } = useMemo(() => {
    if (runs.length === 0) return { totalStart: Date.now(), totalEnd: Date.now() + 1000 };
    const starts = runs.map(r => new Date(r.start_time).getTime());
    const ends = runs.map(r => r.end_time ? new Date(r.end_time).getTime() : Date.now());
    return {
      totalStart: Math.min(...starts),
      totalEnd: Math.max(...ends)
    };
  }, [runs]);

  useEffect(() => {
    if (mainView === 'workflow' && !selectedTrace && rootRuns.length > 0) {
      setSelectedTrace(rootRuns[0]);
      setActiveSpanId(rootRuns[0].id);
    }
  }, [mainView, selectedTrace, rootRuns]);

  // Find the active span in the trace tree
  const activeSpan = useMemo<Run | null>(() => {
    if (!traceTree || !activeSpanId) return null;
    let found: Run | null = null;
    const findSpan = (node: Run) => {
      if (node.id === activeSpanId) found = node;
      if (node.children) node.children.forEach(findSpan);
    };
    findSpan(traceTree);
    return found;
  }, [traceTree, activeSpanId]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleSelectTrace = (run: Run) => {
    setSelectedTrace(run);
    setActiveSpanId(run.id);
  };

  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleCreateProjectSubmit = async (name: string) => {
    const p = await createProject(name);
    setProjects([p, ...projects]);
    setSelectedProject(p);
    setShowCreateProjectModal(false);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    await deleteProject(projectToDelete.id);
    const nextProjects = projects.filter(p => p.id !== projectToDelete.id);
    setProjects(nextProjects);
    if (selectedProject?.id === projectToDelete.id) {
      setSelectedProject(nextProjects[0] || null);
      setSelectedTrace(null);
    }
    setActiveMenuId(null);
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  const loadApiKeys = async () => {
    if (!selectedProject) return;
    const keys = await fetchApiKeys(selectedProject.id);
    setApiKeys(keys);
  };

  const handleGenerateKey = async () => {
    if (!selectedProject) return;
    await createApiKey(selectedProject.id);
    await loadApiKeys();
  };

  useEffect(() => {
    if (showApiKeyModal) {
      loadApiKeys();
    }
  }, [showApiKeyModal, selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setChatMessages([]);
      setChatInput('');
    }
  }, [selectedProject]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative" />
        </div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Initializing Observability...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <Toast message={toastMessage} visible={showToast} />

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onSubmit={handleCreateProjectSubmit}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        projectName={projectToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        project={selectedProject}
        apiKeys={apiKeys}
        onGenerate={handleGenerateKey}
        onShowToast={showNotification}
      />

      <ChatPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        selectedProject={selectedProject}
        runs={runs}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        setChatLoading={setChatLoading}
      />
      {/* Sidebar - Claymorphism */}
      <div className="w-72 bg-[#f1f5f9] dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 flex flex-col z-30 border-r border-slate-200 dark:border-slate-800/50 shadow-[10px_0_20px_rgba(0,0,0,0.05),-10px_0_20px_rgba(255,255,255,0.8)] dark:shadow-[10px_0_20px_rgba(0,0,0,0.4),-1px_0_2px_rgba(255,255,255,0.05)_inset]">
        <div className="p-6 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 font-black text-slate-800 dark:text-white text-2xl tracking-tighter italic">
            <div className="p-2 bg-blue-500 rounded-xl shadow-[4px_4px_10px_rgba(59,130,246,0.3),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_5px_rgba(255,255,255,0.4)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_5px_rgba(255,255,255,0.2)]">
              <Zap size={20} fill="white" className="text-white" />
            </div>
            <span>TRACER</span>
          </div>
          <button onClick={handleCreateProject} className="p-2.5 rounded-xl transition-all text-slate-600 dark:text-slate-300 bg-[#f1f5f9] dark:bg-[#1e293b] shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.02)]">
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 space-y-3 mt-4">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 mb-2">Navigation</div>
          
          <button 
            onClick={() => setMainView('traces')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
              mainView === 'traces' 
                ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-[#e2e8f0]/50 dark:hover:bg-[#0f172a]/50"
            )}
          >
            <Activity size={18} strokeWidth={2.5} />
            <span>Traces</span>
          </button>
          
          <button 
            onClick={() => setMainView('analytics')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
              mainView === 'analytics' 
                ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-[#e2e8f0]/50 dark:hover:bg-[#0f172a]/50"
            )}
          >
            <BarChart3 size={18} strokeWidth={2.5} />
            <span>Analytics</span>
          </button>

          <button 
            onClick={() => setMainView('workflow')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
              mainView === 'workflow' 
                ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-[#e2e8f0]/50 dark:hover:bg-[#0f172a]/50"
            )}
          >
            <Network size={18} strokeWidth={2.5} />
            <span>Workflow</span>
          </button>

          <button 
            onClick={() => setMainView('tools')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
              mainView === 'tools' 
                ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-[#e2e8f0]/50 dark:hover:bg-[#0f172a]/50"
            )}
          >
            <Wrench size={18} strokeWidth={2.5} />
            <span>Tools</span>
          </button>

          <div className="h-6" />
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 mb-2">Projects</div>
          {projects.map(p => (
            <div key={p.id} className="flex flex-col mb-2">
              <div className="relative group flex items-center">
                <button
                  onClick={() => { setSelectedProject(p); setSelectedTrace(null); }}
                  className={cn(
                    "flex-1 text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 font-semibold text-sm",
                    selectedProject?.id === p.id 
                      ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-[#e2e8f0]/50 dark:hover:bg-[#0f172a]/50"
                  )}
                >
                  <Database size={16} className={cn(selectedProject?.id === p.id ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500")} />
                  <span className="truncate">{p.name}</span>
                </button>
                
                <div className="absolute right-2 flex items-center h-full">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setActiveMenuId(activeMenuId === p.id ? null : p.id); 
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all z-10",
                      activeMenuId === p.id 
                        ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-slate-800 dark:text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              {activeMenuId === p.id && (
                <div className="pl-12 pr-4 pt-2 pb-2 animate-in slide-in-from-top-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteProject(p);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl bg-[#f1f5f9] dark:bg-[#1e293b] text-red-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.02)] transition-all"
                  >
                    <Trash2 size={14} strokeWidth={2.5} /> Delete Project
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-6 space-y-4 relative">
           <div className="absolute top-0 left-6 right-6 h-px bg-slate-200 dark:bg-slate-700/50" />
           <div className="flex items-center justify-between px-2 pt-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live View</span>
             <div className={cn("w-2.5 h-2.5 rounded-full shadow-inner", isLive ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-slate-300 dark:bg-slate-600")} />
           </div>
           <button 
             onClick={() => setIsLive(!isLive)}
             className={cn(
               "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all",
               isLive 
                ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-green-600 dark:text-green-500 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]" 
                : "bg-[#f1f5f9] dark:bg-[#1e293b] text-slate-400 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)]"
             )}
           >
             {isLive ? "Syncing..." : "Paused"}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-transparent">
        {/* Header / Toolbar */}
        <header className="h-24 flex items-center justify-between px-10 bg-transparent shrink-0 z-20">
          <div className="flex items-center gap-5">
             <div className="p-3.5 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-2xl text-blue-600 dark:text-blue-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)]">
               <LayoutDashboard size={24} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col">
               <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1.5 uppercase italic drop-shadow-sm">
                 {selectedProject?.name || "Workspace"}
               </h1>
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Active Runs</span>
                 <ArrowRightLeft size={10} />
                 <span>Observability</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className={cn(
                "p-3 rounded-2xl transition-all font-black",
                showChatPanel
                  ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-500 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]"
                  : "bg-[#f1f5f9] dark:bg-[#1e293b] text-slate-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)]"
              )}
            >
              <Sparkles size={18} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-3 bg-[#f1f5f9] dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-2xl transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.02)]"
            >
              {theme === 'light' ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
            </button>

            <button
              onClick={() => setShowApiKeyModal(true)}
              className="px-5 py-3 bg-[#f1f5f9] dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.02)]"
            >
              <Key size={16} strokeWidth={2.5} /> API KEYS
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-3 rounded-2xl transition-all font-black",
                showFilters
                  ? "bg-[#e2e8f0] dark:bg-[#0f172a] text-blue-600 dark:text-blue-500 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]"
                  : "bg-[#f1f5f9] dark:bg-[#1e293b] text-slate-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)]"
              )}
            >
              <Filter size={18} strokeWidth={2.5} />
            </button>
            
            <div className="relative group ml-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" strokeWidth={3} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search traces..." 
                className="pl-12 pr-6 py-3 bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        {showFilters && (
          <div className="px-10 py-6 mx-8 mb-4 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-3xl shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.02)] animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="running">Running</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Run Type</label>
                <select
                  value={filters.run_type}
                  onChange={(e) => setFilters({...filters, run_type: e.target.value})}
                  className="bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100"
                >
                  <option value="">All Types</option>
                  <option value="chain">Chain</option>
                  <option value="llm">LLM</option>
                  <option value="tool">Tool</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Min Latency (ms)</label>
                <input
                  type="number"
                  value={filters.min_latency}
                  onChange={(e) => setFilters({...filters, min_latency: e.target.value})}
                  placeholder="e.g. 1000"
                  className="bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-32 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tags (comma sep.)</label>
                <input
                  type="text"
                  value={filters.tags}
                  onChange={(e) => setFilters({...filters, tags: e.target.value})}
                  placeholder="tag1, tag2"
                  className="bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</label>
                <input
                  type="datetime-local"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="bg-[#e2e8f0] dark:bg-[#0f172a] rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_2px_rgba(255,255,255,0.02)] text-slate-900 dark:text-slate-100"
                />
              </div>

              <button 
                onClick={() => setFilters({status: '', run_type: '', min_latency: '', tags: '', start_date: '', end_date: ''})}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all mb-0.5"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Trace List & Detail Container or Analytics */}
        <main className="flex-1 overflow-hidden flex">
          {mainView === 'workflow' ? (
            <WorkflowView run={traceTree} />
          ) : mainView === 'tools' ? (
            <ToolsView runs={runs} />
          ) : mainView === 'analytics' ? (
            <AnalyticsDashboard runs={runs} />
          ) : (
            <>
              {/* Main Trace Table (Flat List of Traces) */}
              <div className={cn("flex-1 overflow-y-auto", selectedTrace && "hidden xl:block")}>
                 <div className="p-8">
                   <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                     <div className="flex items-center py-5 px-8 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        <div className="min-w-[300px] flex-1">Trace Name</div>
                        <div className="flex items-center gap-8 px-4">
                          <div className="w-20 text-right">Latency</div>
                          <div className="w-20 text-right">Total Cost</div>
                          <div className="w-24 px-3">Status</div>
                          <div className="w-48 hidden lg:block">Timeline</div>
                        </div>
                     </div>
                     <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rootRuns.map(run => (
                          <HierarchicalRow 
                            key={run.id}
                            run={run}
                            depth={0}
                            selectedId={selectedTrace?.id || ''}
                            onSelect={handleSelectTrace}
                            totalStart={totalStart}
                            totalEnd={totalEnd}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                          />
                        ))}
                        {rootRuns.length === 0 && (
                          <div className="py-32 flex flex-col items-center justify-center text-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                            <Activity className="text-blue-600 mb-6 animate-pulse" size={64} />
                            <h3 className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter mb-2 italic">WAITING FOR TRACES</h3>
                            <p className="text-slate-500 max-w-sm text-sm font-medium">
                              Connect your LangChain agent and start executing. Spans will appear here in real-time as they are captured.
                            </p>
                          </div>
                        )}
                     </div>
                   </div>
                 </div>
              </div>

              {/* Full Trace Detail / Drill-Down */}
              {selectedTrace && (
                <>
                  {/* Resizer */}
                  <div 
                    className="w-1 hover:w-1.5 bg-slate-200/50 dark:bg-slate-800 hover:bg-blue-500/30 cursor-col-resize z-50 transition-all hidden xl:block"
                    onMouseDown={() => { isResizingDetail.current = true; document.body.style.cursor = 'col-resize'; }}
                  />
                  <div 
                    style={{ width: window.innerWidth > 1280 ? `${detailWidth}px` : '100%' }}
                    className="shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col overflow-hidden shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.3)] z-40 animate-in slide-in-from-right duration-500 ease-out"
                  >
                    <div className="h-24 flex items-center justify-between px-8 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="flex items-center gap-6">
                        <button onClick={() => setSelectedTrace(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                          <ChevronRight className="rotate-180" size={28} />
                        </button>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-widest">{selectedTrace.run_type}</span>
                            <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight truncate max-w-[400px] italic underline decoration-blue-600/30 underline-offset-4">{selectedTrace.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono uppercase tracking-tighter">{selectedTrace.id}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedTrace.id);
                                showNotification("Trace ID copied!");
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                      {/* Secondary Trace Execution Sidebar */}
                      <div 
                        style={{ width: `${sidebarWidth}px` }}
                        className="bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-6 flex flex-col shrink-0"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Execution Tree</span>
                          <div className="flex items-center bg-slate-200/50 dark:bg-slate-800 rounded-lg p-0.5">
                            <button 
                              onClick={() => setViewMode('tree')}
                              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'tree' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700")}
                            >
                              <Layers size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('graph')}
                              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'graph' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700")}
                            >
                              <Network size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('transcript')}
                              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'transcript' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700")}
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                          {traceTree && viewMode === 'tree' && (
                            <div className="h-full overflow-y-auto">
                              <HierarchicalRow 
                                run={traceTree} 
                                depth={0} 
                                selectedId={activeSpanId || ''} 
                                onSelect={(r) => setActiveSpanId(r.id)}
                                totalStart={new Date(traceTree.start_time).getTime()}
                                totalEnd={traceTree.end_time ? new Date(traceTree.end_time).getTime() : Date.now()}
                                expandedIds={new Set([traceTree.id, ...(traceTree.children || []).map(c => c.id)])}
                                toggleExpand={() => {}}
                              />
                            </div>
                          )}
                          {traceTree && viewMode === 'transcript' && (
                            <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-transparent">
                               {(() => {
                                  const steps: React.ReactNode[] = [];
                                  
                                  const traverse = (node: Run) => {
                                    // Identify User Inputs (usually root chain or specific chain inputs)
                                    if (node.id === traceTree.id && node.inputs && Object.keys(node.inputs).length > 0) {
                                       steps.push(
                                         <div key={`${node.id}-user`} className="flex justify-end mb-6">
                                           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-3xl rounded-tr-sm max-w-[85%] shadow-[0_8px_30px_rgba(59,130,246,0.3)] border border-white/10">
                                             <div className="text-sm whitespace-pre-wrap font-medium">
                                               {typeof node.inputs === 'string' ? node.inputs : JSON.stringify(node.inputs, null, 2)}
                                             </div>
                                           </div>
                                         </div>
                                       );
                                    }

                                    if (node.run_type === 'llm') {
                                      steps.push(
                                        <div key={node.id} className="flex gap-4 mb-4 max-w-[90%] group">
                                           <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                             <Cpu size={14} className="text-slate-600 dark:text-slate-300" />
                                           </div>
                                           <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl rounded-tl-sm p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative w-full transition-all hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]">
                                             <div className="absolute -top-3 left-6 bg-white dark:bg-slate-800 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Clock size={10} />
                                                {node.end_time ? `${new Date(node.end_time).getTime() - new Date(node.start_time).getTime()}ms` : "..."}
                                             </div>
                                             <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
                                               {typeof node.outputs?.output === 'string' ? node.outputs.output : JSON.stringify(node.outputs, null, 2)}
                                             </div>
                                           </div>
                                        </div>
                                      );
                                    } else if (node.run_type === 'tool') {
                                      steps.push(
                                        <div key={node.id} className="ml-12 mb-6 max-w-[85%]">
                                           <div className="bg-slate-100/50 dark:bg-black/40 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl p-4 shadow-inner hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                  <div className="p-1.5 bg-white/10 rounded-lg border border-white/5 shadow-sm">
                                                    <Terminal size={14} className="text-amber-500" />
                                                  </div>
                                                  <span className="font-black uppercase tracking-widest text-[10px] text-amber-600 dark:text-amber-400">Tool Executed: {node.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  {node.end_time ? `${new Date(node.end_time).getTime() - new Date(node.start_time).getTime()}ms` : "running..."}
                                                </span>
                                              </div>
                                              
                                              <div className="space-y-3">
                                                {/* Tool Inputs Pill */}
                                                <div>
                                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Inputs</span>
                                                  <div className="text-xs font-mono bg-white dark:bg-black/60 text-slate-600 dark:text-slate-300 p-3 rounded-xl border border-slate-200 dark:border-white/5 overflow-x-auto shadow-inner">
                                                    {JSON.stringify(node.inputs)}
                                                  </div>
                                                </div>

                                                {/* Tool Outputs Pill */}
                                                <div>
                                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Outputs</span>
                                                  <div className="text-xs font-mono bg-white dark:bg-black/60 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl border border-slate-200 dark:border-white/5 overflow-x-auto shadow-inner">
                                                    {typeof node.outputs?.output === 'string' ? node.outputs.output : JSON.stringify(node.outputs, null, 2)}
                                                  </div>
                                                </div>
                                              </div>
                                           </div>
                                        </div>
                                      );
                                    }

                                    // Display Final Output for the root node if it exists and isn't just an LLM mirroring
                                    if (node.id === traceTree.id && node.outputs && Object.keys(node.outputs).length > 0 && !node.children?.some(c => c.run_type === 'llm' && JSON.stringify(c.outputs) === JSON.stringify(node.outputs))) {
                                       steps.push(
                                         <div key={`${node.id}-final`} className="flex gap-4 mt-8 mb-4 max-w-[90%]">
                                           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20">
                                             <Activity size={14} className="text-white" />
                                           </div>
                                           <div className="bg-emerald-50 dark:bg-emerald-900/10 backdrop-blur-xl border border-emerald-200 dark:border-emerald-500/20 rounded-3xl rounded-tl-sm p-5 shadow-[0_8px_30px_rgba(16,185,129,0.1)] relative w-full">
                                             <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Final Response</div>
                                             <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
                                               {typeof node.outputs?.output === 'string' ? node.outputs.output : JSON.stringify(node.outputs, null, 2)}
                                             </div>
                                           </div>
                                         </div>
                                       );
                                    }

                                    if (node.children) {
                                      node.children.forEach(traverse);
                                    }
                                  };
                                  
                                  traverse(traceTree);
                                  
                                  if (steps.length === 0) {
                                    return <div className="text-slate-400 text-center py-8 text-sm italic">No transcript data available for this trace.</div>;
                                  }
                                  return steps;
                               })()}
                            </div>
                          )}
                          {traceTree && viewMode === 'graph' && (
                            <div className="h-full w-full relative bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-200 dark:border-slate-800"
                              onMouseDown={() => { isPanningGraph.current = true; }}
                              onMouseMove={(e) => {
                                if (isPanningGraph.current) {
                                  setGraphPos(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
                                }
                              }}
                              onMouseUp={() => { isPanningGraph.current = false; }}
                              onMouseLeave={() => { isPanningGraph.current = false; }}
                              onWheel={(e) => {
                                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                                setGraphScale(prev => Math.max(0.2, Math.min(prev * delta, 3)));
                              }}
                            >
                              <div 
                                className="absolute origin-top-left transition-transform duration-75"
                                style={{ 
                                  transform: `translate(${graphPos.x}px, ${graphPos.y}px) scale(${graphScale})`,
                                  padding: '100px' 
                                }}
                              >
                                <GraphNode node={traceTree} activeId={activeSpanId} onSelect={setActiveSpanId} />
                              </div>

                              {/* Graph Controls */}
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                 <button 
                                   onClick={() => setGraphScale(prev => Math.min(prev * 1.2, 3))}
                                   className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                 >
                                   <Plus size={16} />
                                 </button>
                                 <button 
                                   onClick={() => setGraphScale(prev => Math.max(prev * 0.8, 0.2))}
                                   className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                 >
                                   <Minus size={16} />
                                 </button>
                                 <button 
                                   onClick={() => { setGraphScale(1); setGraphPos({ x: 0, y: 0 }); }}
                                   className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                 >
                                   <Maximize size={16} />
                                 </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resizer */}
                      <div 
                        className="w-1 hover:w-1.5 bg-slate-200/50 dark:bg-slate-800 hover:bg-blue-500/30 cursor-col-resize z-50 transition-all"
                        onMouseDown={() => { isResizingSidebar.current = true; document.body.style.cursor = 'col-resize'; }}
                      />

                      {/* Rich Data Inspector for Active Span */}
                      <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900/30">
                      {activeSpan && (
                        <>
                          {/* Top Metric Strip */}
                          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm min-w-0">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Latency</span>
                               <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic truncate" title={activeSpan.end_time ? `${new Date(activeSpan.end_time).getTime() - new Date(activeSpan.start_time).getTime()}ms` : "Active"}>{activeSpan.end_time ? `${new Date(activeSpan.end_time).getTime() - new Date(activeSpan.start_time).getTime()}ms` : "Active"}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm min-w-0">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Input Tokens</span>
                               <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter italic truncate" title={String(activeSpan.outputs?.llm_output?.token_usage?.prompt_tokens || 0)}>{activeSpan.outputs?.llm_output?.token_usage?.prompt_tokens || 0}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm min-w-0">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Output Tokens</span>
                               <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tighter italic truncate" title={String(activeSpan.outputs?.llm_output?.token_usage?.completion_tokens || 0)}>{activeSpan.outputs?.llm_output?.token_usage?.completion_tokens || 0}</span>
                            </div>
                          </div>

                          <section className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                              <div className="p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-900/10">
                                <Terminal size={20} />
                              </div>
                              <h4 className="font-black tracking-tight text-xl italic uppercase underline decoration-blue-600/20 underline-offset-8">INPUT PAYLOAD</h4>
                            </div>
                            <div className="bg-slate-950 dark:bg-black rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group border-4 border-slate-900 dark:border-slate-800">
                              <JsonView data={activeSpan.inputs} />
                            </div>
                          </section>

                          {activeSpan.outputs && (
                            <section className="space-y-4">
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/10">
                                  <Braces size={20} />
                                </div>
                                <h4 className="font-black tracking-tight text-xl italic uppercase underline decoration-blue-600/20 underline-offset-8">OUTPUT RESULTS</h4>
                              </div>
                              <div className="bg-slate-950 dark:bg-black rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group border-4 border-slate-900 dark:border-slate-800">
                                <JsonView data={activeSpan.outputs} />
                              </div>
                            </section>
                          )}

                          {activeSpan.error && (
                            <section className="space-y-4">
                              <div className="flex items-center gap-3 text-red-600">
                                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-600/20">
                                  <Bug size={20} />
                                </div>
                                <h4 className="font-black tracking-tight text-xl italic uppercase underline decoration-red-600/20 underline-offset-8">CRITICAL ERROR</h4>
                              </div>
                              <div className="bg-red-50 dark:bg-red-950/20 border-4 border-red-100 dark:border-red-900/30 rounded-[2rem] p-8 text-red-700 dark:text-red-400 text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-lg">
                                {activeSpan.error}
                              </div>
                            </section>
                          )}
                        </>
                      )}
                      <div className="h-20" />
                    </div>
                  </div>
                </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
