import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Filter, MoreVertical, Edit, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { Button, Card, Badge, Input, Select, Modal, Alert } from './ui';
import * as XLSX from 'xlsx';

const ApplicationsList = ({ applicationId, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [studentTypeFilter, setStudentTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const debouncedSearch = React.useRef(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(studentTypeFilter && { student_type: studentTypeFilter }),
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await api.get('/admin/applications', { params });
      setApplications(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, studentTypeFilter, searchQuery]);

  useEffect(() => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      setPage(1);
      fetchApplications();
    }, 300);

    return () => clearTimeout(debouncedSearch.current);
  }, [searchQuery, statusFilter, studentTypeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [page, fetchApplications]);

  const handleExport = () => {
    const data = applications.map((app) => ({
      [t('name')]: app.profile?.full_name || 'N/A',
      [t('email')]: app.profile?.email || 'N/A',
      [t('phone')]: app.profile?.phone || 'N/A',
      [t('student_type')]: app.student_type || 'N/A',
      [t('status')]: app.status || 'N/A',
      [t('grade')]: app.grade_average || 'N/A',
      [t('date')]: new Date(app.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    XLSX.writeFile(workbook, `applications-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('exported_successfully'));
  };

  const handleDelete = async (appId) => {
    if (confirm(t('confirm_delete'))) {
      try {
        await api.delete(`/admin/applications/${appId}`);
        toast.success(t('application_deleted'));
        fetchApplications();
      } catch (error) {
        toast.error('Failed to delete application');
      }
    }
  };

  const statusOptions = [
    { value: '', label: t('all_statuses') },
    { value: 'pending', label: t('pending') },
    { value: 'approved', label: t('approved') },
    { value: 'rejected', label: t('rejected') },
    { value: 'waitlisted', label: t('waitlisted') },
  ];

  const studentTypeOptions = [
    { value: '', label: t('all_types') },
    { value: 'CPGE', label: 'CPGE' },
    { value: 'Lycée Technique', label: t('technical_high_school') },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('applications')}</h3>
        <Button variant="primary" icon={Download} onClick={handleExport} size="sm">
          {t('export')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder={t('search_by_name_email')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder={t('filter_by_status')}
        />

        <Select
          options={studentTypeOptions}
          value={studentTypeFilter}
          onChange={setStudentTypeFilter}
          placeholder={t('filter_by_type')}
        />
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('no_applications_found')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {t('name')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {t('contact')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {t('type')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {t('date')}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((app) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    {app.profile?.full_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                    <div>{app.profile?.email || 'N/A'}</div>
                    <div>{app.profile?.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{app.student_type || 'N/A'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'success'
                          : app.status === 'rejected'
                          ? 'error'
                          : app.status === 'waitlisted'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {t(app.status || 'pending')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowModal(true);
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title={t('view')}
                      >
                        <Eye size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => onEdit(app.id)}
                        className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
                        title={t('edit')}
                      >
                        <Edit size={18} className="text-yellow-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('page')} {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('next')}
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('application_details')}>
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('name')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedApp.profile?.full_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('status')}</p>
                <Badge variant={selectedApp.status === 'approved' ? 'success' : 'warning'}>
                  {t(selectedApp.status || 'pending')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('email')}</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedApp.profile?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('phone')}</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedApp.profile?.phone}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ApplicationsList;
