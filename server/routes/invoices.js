const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All invoice routes require authentication
router.use(authenticateToken);

// Get all invoices for the authenticated user
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT i.*,
             COUNT(ii.id) as item_count
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.user_id = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;

    const [result] = await pool.execute(query, [req.user.id]);
    res.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get a specific invoice with items
router.get('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Get invoice details
    const invoiceQuery = `
      SELECT * FROM invoices
      WHERE id = ? AND user_id = ?
    `;
    const [invoiceResult] = await pool.execute(invoiceQuery, [invoiceId, req.user.id]);

    if (invoiceResult.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get invoice items
    const itemsQuery = `
      SELECT * FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY id
    `;
    const [itemsResult] = await pool.execute(itemsQuery, [invoiceId]);

    const invoice = {
      ...invoiceResult[0],
      items: itemsResult
    };

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create a new invoice
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      clientName,
      clientAddress,
      clientEmail,
      clientPhone,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes
    } = req.body;

    // Insert invoice
    const invoiceQuery = `
      INSERT INTO invoices (
        user_id, invoice_number, invoice_date, due_date,
        company_name, company_address, company_email, company_phone,
        client_name, client_address, client_email, client_phone,
        subtotal, tax_rate, tax_amount, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const invoiceValues = [
      req.user.id, invoiceNumber, invoiceDate, dueDate,
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      subtotal, taxRate, taxAmount, totalAmount, notes
    ];

    const [invoiceResult] = await connection.execute(invoiceQuery, invoiceValues);
    const invoiceId = invoiceResult.insertId;

    // Insert invoice items
    if (items && items.length > 0) {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, description, quantity, price, total)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const item of items) {
        await connection.execute(itemQuery, [
          invoiceId,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]);
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Invoice created successfully',
      invoiceId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  } finally {
    connection.release();
  }
});

// Update an invoice
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const invoiceId = req.params.id;
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      clientName,
      clientAddress,
      clientEmail,
      clientPhone,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes,
      status
    } = req.body;

    // Check if invoice belongs to user
    const checkQuery = 'SELECT id FROM invoices WHERE id = ? AND user_id = ?';
    const [checkResult] = await connection.execute(checkQuery, [invoiceId, req.user.id]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice
    const updateQuery = `
      UPDATE invoices SET
        invoice_number = ?, invoice_date = ?, due_date = ?,
        company_name = ?, company_address = ?, company_email = ?, company_phone = ?,
        client_name = ?, client_address = ?, client_email = ?, client_phone = ?,
        subtotal = ?, tax_rate = ?, tax_amount = ?, total_amount = ?,
        notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const updateValues = [
      invoiceNumber, invoiceDate, dueDate,
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      subtotal, taxRate, taxAmount, totalAmount, notes, status || 'draft',
      invoiceId
    ];

    await connection.execute(updateQuery, updateValues);

    // Delete existing items and insert new ones
    await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    if (items && items.length > 0) {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, description, quantity, price, total)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const item of items) {
        await connection.execute(itemQuery, [
          invoiceId,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]);
      }
    }

    await connection.commit();

    res.json({ message: 'Invoice updated successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  } finally {
    connection.release();
  }
});

// Delete an invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Check if invoice belongs to user and delete
    const deleteQuery = 'DELETE FROM invoices WHERE id = ? AND user_id = ?';
    const [result] = await pool.execute(deleteQuery, [invoiceId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;