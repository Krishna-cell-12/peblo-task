// src/pages/InsightsPage.jsx
// ─────────────────────────────────────────────────────────────────
// Productivity Insights dashboard. Shows:
//  - Stats cards: total notes, AI summaries, public notes, archived
//  - Activity bar chart (last 7 days)
//  - Most-used tags
//  - Recently edited notes list
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  FileText, Sparkles, Globe, Archive,
  TrendingUp, Clock, Tag, Loader2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getInsights } from '../api/notes';
import { formatDistanceToNow } from '../utils/date';

const StatCard = ({ icon: Icon, label, value, color = 'brand' }) => (
  <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                     bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-medium text-gray-800 dark:text-white">{label}</p>
      <p className="text-brand-500">{payload[0].value} note{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

const InsightsPage = () => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getInsights();
        setInsights(data);
      } catch {
        setError('Failed to load insights. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Fill in missing days in the activity chart with 0
  const activityData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = insights?.activity_last_7_days?.find((a) => a.date === dateStr);
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: match?.count || 0,
      });
    }
    return days;
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900">
      <Sidebar onNewNote={() => {}} />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={22} className="text-brand-500" />
              Productivity Insights
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              A summary of your notes workspace activity.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <Loader2 size={28} className="animate-spin text-brand-500" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>
          )}

          {insights && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={FileText}  label="Total Notes"          value={insights.total_notes}            color="brand" />
                <StatCard icon={Sparkles}  label="AI Summaries"         value={insights.ai_summaries_generated} color="purple" />
                <StatCard icon={Globe}     label="Public Notes"         value={insights.public_notes}           color="emerald" />
                <StatCard icon={Archive}   label="Archived Notes"       value={insights.archived_notes}         color="amber" />
              </div>

              {/* Activity chart */}
              <div className="glass-card p-6 mb-6 animate-slide-up">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-brand-500" />
                  Notes Created — Last 7 Days
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.1)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
                    <Bar dataKey="count" fill="#6c63ff" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most-used tags */}
                <div className="glass-card p-5 animate-slide-up">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Tag size={14} className="text-brand-500" />
                    Most-Used Tags
                  </h2>
                  {insights.most_used_tags.length === 0 ? (
                    <p className="text-sm text-gray-400">No tags added yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {insights.most_used_tags.slice(0, 8).map(({ tag, count }) => {
                        const max = insights.most_used_tags[0]?.count || 1;
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={tag}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tag}</span>
                              <span className="text-xs text-gray-400">{count} note{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recently edited */}
                <div className="glass-card p-5 animate-slide-up">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-brand-500" />
                    Recently Edited
                  </h2>
                  {insights.recently_edited.length === 0 ? (
                    <p className="text-sm text-gray-400">No notes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.recently_edited.map((note) => (
                        <div key={note.id} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {note.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDistanceToNow(note.updated_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-600 mt-6 text-center">
                Last refreshed: {new Date(insights.generated_at).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InsightsPage;
