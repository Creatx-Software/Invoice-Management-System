import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, ArrowUp } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from './components/PDFDocument';
import Login from './components/Login';
import InvoiceList from './components/InvoiceList';
import Header from './components/Header';
import config from './config';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoice, setInvoice] = useState({
    invoiceNumber: 'INV001',
    purchaseOrder: 'ON001',
    logo: null,
    companyDetails: '',
    billTo: '',
    currency: 'LKR',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [
      { description: '', unitCost: '', quantity: '', amount: 0 }
    ],
    notes: '',
    bankDetails: '',
    taxRate: 0,
    discount: 0,
    shippingFee: 0
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currencies = [
    { code: 'LKR', name: 'Sri Lanka rupee', flag: '🇱🇰' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  ];

  // Check for existing authentication on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentView('list');
    setEditingInvoiceId(null);
    resetInvoiceForm();
  };

  const resetInvoiceForm = () => {
    setInvoice({
      invoiceNumber: `INV${Date.now().toString().slice(-6)}`,
      purchaseOrder: 'ON001',
      logo: null,
      companyDetails: '',
      billTo: '',
      currency: 'LKR',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [
        { description: '', unitCost: '', quantity: '', amount: 0 }
      ],
      notes: '',
      bankDetails: '',
      taxRate: 0,
      discount: 0,
      shippingFee: 0
    });
  };

  const handleCreateNew = () => {
    resetInvoiceForm();
    setEditingInvoiceId(null);
    setCurrentView('form');
  };

  const handleEditInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const invoiceData = await response.json();

        // Convert backend data to frontend format
        setInvoice({
          invoiceNumber: invoiceData.invoice_number,
          purchaseOrder: invoiceData.purchase_order || '',
          logo: null, // Note: Logo handling might need backend support
          companyDetails: [
            invoiceData.company_name,
            invoiceData.company_address,
            invoiceData.company_email,
            invoiceData.company_phone
          ].filter(Boolean).join('\n'),
          billTo: [
            invoiceData.client_name,
            invoiceData.client_address,
            invoiceData.client_email,
            invoiceData.client_phone
          ].filter(Boolean).join('\n'),
          currency: 'LKR', // You might want to add currency to backend
          invoiceDate: invoiceData.invoice_date,
          dueDate: invoiceData.due_date || '',
          items: invoiceData.items.map(item => ({
            description: item.description,
            unitCost: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 0,
            amount: parseFloat(item.total) || 0
          })),
          notes: invoiceData.notes || '',
          bankDetails: '', // You might want to add this to backend
          taxRate: parseFloat(invoiceData.tax_rate) || 0,
          discount: 0, // You might want to add this to backend
          shippingFee: 0 // You might want to add this to backend
        });

        setEditingInvoiceId(invoiceId);
        setCurrentView('form');
      } else {
        alert('Failed to load invoice');
      }
    } catch (error) {
      alert('Unable to load invoice');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingInvoiceId(null);
  };

  const handleChange = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate amount
    if (field === 'unitCost' || field === 'quantity') {
      const unitCost = parseFloat(newItems[index].unitCost) || 0;
      const quantity = parseFloat(newItems[index].quantity) || 0;
      newItems[index].amount = unitCost * quantity;
    }

    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', unitCost: '', quantity: '', amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      setInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const moveItemUp = (index) => {
    if (index > 0) {
      const newItems = [...invoice.items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setInvoice(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setInvoice(prev => ({ ...prev, logo: null }));
  };

  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const discountAmount = parseFloat(invoice.discount) || 0;
  const shippingAmount = parseFloat(invoice.shippingFee) || 0;
  const total = subtotal + taxAmount - discountAmount + shippingAmount;

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    try {
      // Parse company and client details
      const companyLines = invoice.companyDetails.split('\n').filter(line => line.trim());
      const clientLines = invoice.billTo.split('\n').filter(line => line.trim());

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || null,
        companyName: companyLines[0] || '',
        companyAddress: companyLines.slice(1).join('\n') || '',
        companyEmail: companyLines.find(line => line.includes('@')) || '',
        companyPhone: companyLines.find(line => /[\d+\-()]+/.test(line)) || '',
        clientName: clientLines[0] || '',
        clientAddress: clientLines.slice(1).join('\n') || '',
        clientEmail: clientLines.find(line => line.includes('@')) || '',
        clientPhone: clientLines.find(line => /[\d+\-()]+/.test(line)) || '',
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.unitCost) || 0,
          total: item.amount
        })),
        subtotal,
        taxRate: invoice.taxRate,
        taxAmount,
        totalAmount: total,
        notes: invoice.notes
      };

      const url = editingInvoiceId
        ? `${config.API_BASE_URL}/api/invoices/${editingInvoiceId}`
        : `${config.API_BASE_URL}/api/invoices`;

      const method = editingInvoiceId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        alert(editingInvoiceId ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
        setCurrentView('list');
        setEditingInvoiceId(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to save invoice: ${errorData.error}`);
      }
    } catch (error) {
      alert('Unable to save invoice. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<PDFDocument invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Show login if not authenticated
  if (!user || !token) {
    return <Login onLogin={handleLogin} />;
  }

  // Show invoice list
  if (currentView === 'list') {
    return (
      <>
        <Header user={user} onLogout={handleLogout} />
        <InvoiceList
          onCreateNew={handleCreateNew}
          onEditInvoice={handleEditInvoice}
          user={user}
          token={token}
        />
      </>
    );
  }

  // Show invoice form
  return (
    <>
      <Header
        user={user}
        onLogout={handleLogout}
        onBack={handleBackToList}
        showBack={true}
        onSave={handleSaveInvoice}
        showSave={true}
        saveLabel={editingInvoiceId ? (isSaving ? 'Updating...' : 'Update Invoice') : (isSaving ? 'Saving...' : 'Save Invoice')}
      />
      <div className="min-h-screen bg-brand-primary py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-secondary mb-3 uppercase tracking-wide">
              {editingInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
            <p className="text-green-100 text-sm md:text-base">
              {editingInvoiceId ? 'Update your invoice details' : 'Create a professional invoice in minutes'}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Row 1: Invoice Number, Purchase Order, Logo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice number
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase order
                </label>
                <input
                  type="text"
                  value={invoice.purchaseOrder}
                  onChange={(e) => handleChange('purchaseOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                  {invoice.logo && (
                    <button
                      onClick={removeLogo}
                      className="ml-2 text-red-600 underline text-xs hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </label>
                {!invoice.logo ? (
                  <label className="w-full h-[52px] flex items-center justify-center border-2 border-dashed border-brand-border rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Upload file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="w-full h-[120px] border border-brand-border rounded-lg overflow-hidden">
                    <img src={invoice.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Company Details & Bill To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your company details
                </label>
                <textarea
                  value={invoice.companyDetails}
                  onChange={(e) => handleChange('companyDetails', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                  placeholder="Company name, address, contact info..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill to
                </label>
                <textarea
                  value={invoice.billTo}
                  onChange={(e) => handleChange('billTo', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                  placeholder="Client name, address, contact info..."
                />
              </div>
            </div>

            {/* Row 3: Currency, Invoice Date, Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary appearance-none bg-white"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice date
                </label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6 bg-brand-items rounded-xl p-6">
              <div className="grid grid-cols-12 gap-3 mb-4 text-sm font-medium text-gray-700">
                <div className="col-span-5">Item description</div>
                <div className="col-span-2 text-center">Unit cost</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2 text-right font-semibold">
                    {(parseFloat(item.amount) || 0).toFixed(0)}
                  </div>
                  <div className="col-span-1 flex gap-1 justify-end">
                    <button
                      onClick={() => moveItemUp(index)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      disabled={index === 0}
                    >
                      <ArrowUp className={`w-4 h-4 ${index === 0 ? 'text-gray-300' : 'text-green-600'}`} />
                    </button>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      disabled={invoice.items.length === 1}
                    >
                      <X className={`w-4 h-4 ${invoice.items.length === 1 ? 'text-gray-300' : 'text-red-600'}`} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col items-center mt-4">
                <button
                  onClick={addItem}
                  className="w-12 h-12 bg-brand-secondary hover:bg-brand-hover rounded-full flex items-center justify-center transition-colors shadow-sm mb-2"
                >
                  <Plus className="w-5 h-5 text-brand-icon" />
                </button>
                <span className="text-sm text-gray-700 font-medium">Add item</span>
              </div>
            </div>

            {/* Bottom Section: Notes & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left: Notes & Bank Details */}
              <div className="space-y-6 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes / payment terms
                  </label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                    placeholder="Payment terms, thank you note..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank account details
                  </label>
                  <textarea
                    value={invoice.bankDetails}
                    onChange={(e) => handleChange('bankDetails', e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                    placeholder="Bank name, account number..."
                  />
                </div>
              </div>

              {/* Right: Totals */}
              <div className="space-y-6 md:col-span-3 md:pl-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">Subtotal</div>
                  <div className="text-xl font-bold text-gray-900">
                    {subtotal.toFixed(2)} {invoice.currency}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-600">Tax %</label>
                    <div className="relative w-48">
                      <input
                        type="number"
                        value={invoice.taxRate}
                        onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary pr-8"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-600">Discount ({invoice.currency})</label>
                    <div className="w-48">
                      <input
                        type="number"
                        value={invoice.discount}
                        onChange={(e) => handleChange('discount', e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-600">Shipping fee</label>
                    <div className="w-48">
                      <input
                        type="number"
                        value={invoice.shippingFee}
                        onChange={(e) => handleChange('shippingFee', e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 ">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {total.toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex-1 py-2 bg-brand-secondary hover:bg-brand-hover text-brand-icon text-lg font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;