import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Calendar, DollarSign, Search, Eye, Trash2 } from 'lucide-react';
import config from '../config';

function InvoiceList({ onCreateNew, onEditInvoice, user, token }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (error) {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      alert('Unable to delete invoice');
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-brand-secondary rounded-full animate-spin"></div>
              <FileText className="w-8 h-8 text-brand-secondary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Invoice <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="text-gray-600 text-base flex items-center gap-2">
                Welcome back, <span className="font-semibold text-brand-secondary">{user.fullName}</span>
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="btn-primary flex items-center gap-2 self-start md:self-auto"
            >
              <Plus className="w-5 h-5" />
              Create New Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <div className="card-gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card-gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Paid</p>
                <p className="text-3xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card-gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-blue-600">
                  {invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card-gradient">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-6 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number or client name..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 animate-slide-down">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Invoice List */}
        <div className="card animate-slide-up overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-brand-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search terms to find what you\'re looking for' : 'Get started by creating your first professional invoice'}
              </p>
              {!searchTerm && (
                <button
                  onClick={onCreateNew}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Invoice</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice, index) => (
                    <tr key={invoice.id} className="table-row" style={{animationDelay: `${index * 0.05}s`}}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">{invoice.item_count} items</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{invoice.client_name}</div>
                        {invoice.client_email && (
                          <div className="text-sm text-gray-500">{invoice.client_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-brand-secondary" />
                          <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-bold text-gray-900 text-lg">
                          <DollarSign className="w-5 h-5 text-brand-success" />
                          {formatCurrency(invoice.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          invoice.status === 'paid'
                            ? 'badge-success'
                            : invoice.status === 'sent'
                            ? 'badge-info'
                            : invoice.status === 'overdue'
                            ? 'badge-danger'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditInvoice(invoice.id)}
                            className="btn-icon text-brand-secondary"
                            title="View/Edit Invoice"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="btn-icon-danger text-red-600"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoiceList;