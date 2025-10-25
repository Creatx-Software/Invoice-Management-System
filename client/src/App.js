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
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {editingInvoiceId ? 'Edit ' : 'Create New '}
              <span className="text-gradient">Invoice</span>
            </h1>
            <p className="text-gray-600 text-base">
              {editingInvoiceId ? 'Update your invoice details below' : 'Fill in the details to generate a professional invoice'}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="card-gradient p-8 md:p-10 animate-slide-up">
            {/* Row 1: Invoice Number, Purchase Order, Logo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="label-text">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  className="input-field-sm"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="label-text">
                  Purchase Order
                </label>
                <input
                  type="text"
                  value={invoice.purchaseOrder}
                  onChange={(e) => handleChange('purchaseOrder', e.target.value)}
                  className="input-field-sm"
                  placeholder="PO-001"
                />
              </div>

              <div>
                <label className="label-text">
                  Company Logo
                  {invoice.logo && (
                    <button
                      onClick={removeLogo}
                      className="ml-2 text-red-600 underline text-xs hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </label>
                {!invoice.logo ? (
                  <label className="w-full h-[42px] flex items-center justify-center border-2 border-dashed border-brand-border rounded-lg cursor-pointer hover:border-brand-secondary hover:bg-blue-50 transition-all group">
                    <Upload className="w-4 h-4 text-gray-400 group-hover:text-brand-secondary transition-colors" />
                    <span className="ml-2 text-sm text-gray-500 group-hover:text-brand-secondary transition-colors">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="w-full h-[120px] border-2 border-brand-border rounded-xl overflow-hidden bg-white shadow-inner-soft">
                    <img src={invoice.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Company Details & Bill To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="label-text">
                  Your Company Details
                </label>
                <textarea
                  value={invoice.companyDetails}
                  onChange={(e) => handleChange('companyDetails', e.target.value)}
                  rows="5"
                  className="input-field-sm resize-none"
                  placeholder="Company name&#10;Street address&#10;Email address&#10;Phone number"
                />
              </div>

              <div>
                <label className="label-text">
                  Bill To (Client Details)
                </label>
                <textarea
                  value={invoice.billTo}
                  onChange={(e) => handleChange('billTo', e.target.value)}
                  rows="5"
                  className="input-field-sm resize-none"
                  placeholder="Client name&#10;Street address&#10;Email address&#10;Phone number"
                />
              </div>
            </div>

            {/* Row 3: Currency, Invoice Date, Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="label-text">
                  Currency
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="input-field-sm appearance-none bg-white"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  className="input-field-sm"
                />
              </div>

              <div>
                <label className="label-text">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="input-field-sm"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8 bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                Invoice Items
              </h3>

              <div className="grid grid-cols-12 gap-3 mb-4 text-xs font-bold text-gray-600 uppercase">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Unit Cost</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-xl hover:bg-blue-50/50 transition-colors">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="input-field-sm"
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        className="input-field-sm text-center"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="input-field-sm text-center"
                        placeholder="0"
                        step="1"
                      />
                    </div>
                    <div className="col-span-2 text-right font-bold text-gray-900 text-lg">
                      {(parseFloat(item.amount) || 0).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex gap-1 justify-end">
                      <button
                        onClick={() => moveItemUp(index)}
                        className="btn-icon text-brand-secondary"
                        disabled={index === 0}
                      >
                        <ArrowUp className={`w-4 h-4 ${index === 0 ? 'text-gray-300' : 'text-brand-secondary'}`} />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="btn-icon-danger text-red-600"
                        disabled={invoice.items.length === 1}
                      >
                        <X className={`w-4 h-4 ${invoice.items.length === 1 ? 'text-gray-300' : 'text-red-600'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={addItem}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Bottom Section: Notes & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left: Notes & Bank Details */}
              <div className="space-y-6 md:col-span-2">
                <div>
                  <label className="label-text">
                    Notes / Payment Terms
                  </label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows="5"
                    className="input-field-sm resize-none"
                    placeholder="Enter payment terms, thank you note, or additional information..."
                  />
                </div>

                <div>
                  <label className="label-text">
                    Bank Account Details
                  </label>
                  <textarea
                    value={invoice.bankDetails}
                    onChange={(e) => handleChange('bankDetails', e.target.value)}
                    rows="5"
                    className="input-field-sm resize-none"
                    placeholder="Bank name&#10;Account number&#10;Routing number&#10;SWIFT/IBAN"
                  />
                </div>
              </div>

              {/* Right: Totals */}
              <div className="md:col-span-3">
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-100">
                    Invoice Summary
                  </h3>

                  <div className="flex justify-between items-center py-2">
                    <div className="text-sm font-medium text-gray-600">Subtotal</div>
                    <div className="text-xl font-bold text-gray-900">
                      {subtotal.toFixed(2)} {invoice.currency}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-4">
                      <label className="text-sm font-medium text-gray-600">Tax Rate</label>
                      <div className="relative w-48">
                        <input
                          type="number"
                          value={invoice.taxRate}
                          onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                          className="input-field-sm pr-10"
                          placeholder="0"
                          step="0.1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <label className="text-sm font-medium text-gray-600">Discount ({invoice.currency})</label>
                      <div className="w-48">
                        <input
                          type="number"
                          value={invoice.discount}
                          onChange={(e) => handleChange('discount', e.target.value)}
                          className="input-field-sm"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <label className="text-sm font-medium text-gray-600">Shipping Fee ({invoice.currency})</label>
                      <div className="w-48">
                        <input
                          type="number"
                          value={invoice.shippingFee}
                          onChange={(e) => handleChange('shippingFee', e.target.value)}
                          className="input-field-sm"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t-2 border-gray-200">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total Amount</span>
                      <span className="text-3xl font-bold text-gradient">
                        {total.toFixed(2)} {invoice.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-8 border-t-2 border-gray-100">
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="btn-secondary flex-1 justify-center text-lg"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </span>
                ) : (
                  'Download PDF'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;