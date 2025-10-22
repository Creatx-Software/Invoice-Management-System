import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header section
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5b6f77',
    marginBottom: 0,
    textAlign: 'left',
  },

  logoContainer: {
    width: 150,
    height: 75,
    alignItems: 'flex-end',
  },

  logo: {
    maxWidth: 150,
    maxHeight: 75,
    objectFit: 'contain',
  },
  
  // Invoice info row
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 30,
    padding: 15,
  },
  
  infoColumn: {
    flexDirection: 'column',
  },
  
  infoLabel: {
    fontSize: 9,
    color: '#5b6f77',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  
  infoValue: {
    fontSize: 11,
    color: '#202124',
    fontWeight: 'normal',
  },
  
  // Details section (From, Billed To, Purchase Order)
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 25,
    padding: 15,
  },

  detailColumn: {
    flex: 1,
  },
  
  detailLabel: {
    fontSize: 9,
    color: '#5b6f77',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  
  detailText: {
    fontSize: 10,
    color: '#202124',
    lineHeight: 1.3,
  },
  
  // Items table
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 7,
    marginBottom: 10,
  },
  
  tableHeaderText: {
    fontSize: 9,
    color: '#5b6f77',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  
  tableCell: {
    fontSize: 10,
    color: '#202124',
  },
  
  // Column widths for table
  descCol: { width: '45%', paddingRight: 10 },
  unitCol: { width: '18%', textAlign: 'right', paddingRight: 10 },
  qtyCol: { width: '12%', textAlign: 'center' },
  amountCol: { width: '25%', textAlign: 'right' },
  
  // Combined section for table + bottom
  combinedSection: {
    marginTop: 15,
    marginLeft: -20,
    marginRight: -20,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingLeft: 35,
    paddingRight: 35,
  },

  // Separator line between table and bottom section
  sectionSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
    marginTop: 15,
    marginBottom: 20,
  },

  // Bottom section
  bottomSection: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 25,
  },

  termsSection: {
    flex: 1.2,
  },

  totalsSection: {
    flex: 1,
  },
  
  sectionLabel: {
    fontSize: 9,
    color: '#5b6f77',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  
  sectionText: {
    fontSize: 10,
    color: '#202124',
    lineHeight: 1.4,
  },
  
  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  
  totalLabel: {
    fontSize: 10,
    color: '#5b6f77',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  
  totalValue: {
    fontSize: 11,
    color: '#202124',
    textAlign: 'right',
  },
  
  taxRateLabel: {
    fontSize: 9,
    color: '#5b6f77',
  },
  
  grandTotalRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
  },

  grandTotalLabel: {
    fontSize: 10,
    color: '#5b6f77',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  grandTotalValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  
  // Bank details section
  bankSection: {
    marginTop: 10,
    padding: 15,
  },
});

const PDFDocument = ({ invoice }) => {
  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} ${invoice.currency}`;
  };
  
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const discountAmount = parseFloat(invoice.discount) || 0;
  const shippingAmount = parseFloat(invoice.shippingFee) || 0;
  const total = subtotal + taxAmount - discountAmount + shippingAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={{ position: 'relative', marginBottom: 15, paddingLeft: 15 }}>
          {/* Title */}
          <Text style={styles.title}>Invoice</Text>

          {/* Logo - positioned absolutely to not affect layout flow */}
          {invoice.logo && invoice.logo.trim() !== '' && (
            <View style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 150,
              height: 75,
              alignItems: 'flex-end'
            }}>
              <Image src={invoice.logo} style={styles.logo} />
            </View>
          )}
        </View>

        {/* Invoice Info Row - Number, Date, Due Date */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Date of Issue</Text>
            <Text style={styles.infoValue}>{invoice.invoiceDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{invoice.dueDate || 'N/A'}</Text>
          </View>
        </View>

        {/* Details Row - Billed To, From, Purchase Order */}
        <View style={styles.detailsRow}>
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Billed To</Text>
            <Text style={styles.detailText}>{invoice.billTo || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>From</Text>
            <Text style={styles.detailText}>{invoice.companyDetails || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailColumn}>
            <Text style={styles.detailLabel}>Purchase Order</Text>
            <Text style={styles.detailText}>{invoice.purchaseOrder || 'N/A'}</Text>
          </View>
        </View>

        {/* Combined Section: Items Table + Terms & Totals */}
        <View style={styles.combinedSection}>
          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.unitCol]}>Unit cost</Text>
              <Text style={[styles.tableHeaderText, styles.qtyCol]}>QTY</Text>
              <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
            </View>

            {invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.descCol]}>
                  {item.description || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.unitCol]}>
                  {item.unitCost || '0'}
                </Text>
                <Text style={[styles.tableCell, styles.qtyCol]}>
                  {item.quantity || '0'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCol]}>
                  {formatCurrency(item.amount || 0)}
                </Text>
              </View>
            ))}
          </View>

          {/* Separator Line */}
          <View style={styles.sectionSeparator}></View>

          {/* Bottom Section - Terms and Totals side by side */}
          <View style={styles.bottomSection}>
            {/* Left: Terms */}
            <View style={styles.termsSection}>
              {invoice.notes && (
                <View>
                  <Text style={styles.sectionLabel}>Terms</Text>
                  <Text style={styles.sectionText}>{invoice.notes}</Text>
                </View>
              )}
            </View>

            {/* Right: Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>

              {invoice.taxRate > 0 && (
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Tax Rate</Text>
                    <Text style={styles.taxRateLabel}>({invoice.taxRate}%)</Text>
                  </View>
                  <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
                </View>
              )}

              {shippingAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Shipping</Text>
                  <Text style={styles.totalValue}>{formatCurrency(shippingAmount)}</Text>
                </View>
              )}

              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(discountAmount)}</Text>
                </View>
              )}

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Invoice Total</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bank Account Details */}
        {invoice.bankDetails && (
          <View style={styles.bankSection}>
            <Text style={styles.sectionLabel}>Bank Account Details</Text>
            <Text style={styles.sectionText}>{invoice.bankDetails}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default PDFDocument;