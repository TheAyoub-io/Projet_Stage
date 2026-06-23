import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Spinner, Alert } from './ui';
import api from '../lib/axios';

// StatCard Component
const StatCard = ({ icon: Icon, label, value, trend, color = 'blue' }) => {
  const colors = {
    blue: 'from-emerald-600 to-emerald-400',
    green: 'from-green-600 to-green-400',
    yellow: 'from-yellow-600 to-yellow-400',
    red: 'from-red-600 to-red-400',
    purple: 'from-purple-600 to-purple-400',
  };

  return (
    <motion.div
      whileHover={{ translateY: -4 }}
      className={`bg-gradient-to-br ${colors[color]} p-6 rounded-xl text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-2">{label}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-100' : 'text-red-100'}`}>
              <TrendingUp size={14} />
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        <div className="opacity-80">
          <Icon size={32} />
        </div>
      </div>
    </motion.div>
  );
};

// AnalyticsChart Component
const AnalyticsChart = ({ title, data, type = 'bar', colors = [] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="value" fill={colors[0] || '#3b82f6'} radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

// StatusDistribution Component
const StatusDistribution = ({ stats }) => {
  const { t } = useTranslation();

  const statusData = [
    { name: t('pending'), value: stats.pending || 0, color: '#f59e0b' },
    { name: t('approved'), value: stats.approved || 0, color: '#10b981' },
    { name: t('rejected'), value: stats.rejected || 0, color: '#ef4444' },
    { name: t('waitlisted'), value: stats.waitlisted || 0, color: '#8b5cf6' },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('status_distribution')}</h3>

      <div className="space-y-4">
        {statusData.map((status) => {
          const percentage = stats.total ? ((status.value / stats.total) * 100).toFixed(1) : 0;
          return (
            <div key={status.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status.name}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {status.value} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ backgroundColor: status.color }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// RecentApplications Component
const RecentApplications = ({ applications, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="p-6">
        <Spinner size="md" message={t('loading_data')} />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('recent_applications')}</h3>

      <div className="space-y-3">
        {applications.slice(0, 5).map((app) => (
          <motion.div
            key={app.id}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {app.profile?.full_name || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{app.profile?.email}</p>
            </div>
            <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : 'warning'}>
              {t(app.status || 'pending')}
            </Badge>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

// Main AdminAnalyticsDashboard Component
const AdminAnalyticsDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data);

        // Fetch recent applications
        const appsRes = await api.get('/admin/applications?page=1&limit=5');
        setApplications(appsRes.data.items || []);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <Alert type="error" title={t('error')} message={error} />;
  }

  if (!stats) {
    return <Spinner fullScreen message={t('loading_dashboard')} />;
  }

  const applicationTrendData = [
    { name: t('january'), value: Math.floor(Math.random() * 100) },
    { name: t('february'), value: Math.floor(Math.random() * 100) },
    { name: t('march'), value: Math.floor(Math.random() * 100) },
    { name: t('april'), value: Math.floor(Math.random() * 100) },
    { name: t('may'), value: Math.floor(Math.random() * 100) },
    { name: t('june'), value: Math.floor(Math.random() * 100) },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label={t('total_applications')} value={stats.total} color="blue" trend={12} />
        <StatCard icon={FileText} label={t('pending')} value={stats.pending} color="yellow" />
        <StatCard icon={Activity} label={t('approved')} value={stats.approved} color="green" />
        <StatCard icon={AlertCircle} label={t('rejected')} value={stats.rejected} color="red" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart
            title={t('application_trend')}
            data={applicationTrendData}
            type="bar"
            colors={['#3b82f6']}
          />
        </div>
        <StatusDistribution stats={stats} />
      </div>

      {/* Recent Applications */}
      <RecentApplications applications={applications} loading={loading} />
    </div>
  );
};

export default AdminAnalyticsDashboard;
