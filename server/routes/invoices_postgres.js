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
      WHERE i.user_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
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
      WHERE id = $1 AND user_id = $2
    `;
    const invoiceResult = await pool.query(invoiceQuery, [invoiceId, req.user.id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get invoice items
    const itemsQuery = `
      SELECT * FROM invoice_items
      WHERE invoice_id = $1
      ORDER BY id
    `;
    const itemsResult = await pool.query(itemsQuery, [invoiceId]);

    const invoice = {
      ...invoiceResult.rows[0],
      items: itemsResult.rows
    };

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create a new invoice
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;

    const invoiceValues = [
      req.user.id, invoiceNumber, invoiceDate, dueDate,
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      subtotal, taxRate, taxAmount, totalAmount, notes
    ];

    const invoiceResult = await client.query(invoiceQuery, invoiceValues);
    const invoiceId = invoiceResult.rows[0].id;

    // Insert invoice items
    if (items && items.length > 0) {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, description, quantity, price, total)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const item of items) {
        await client.query(itemQuery, [
          invoiceId,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Invoice created successfully',
      invoiceId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  } finally {
    client.release();
  }
});

// Update an invoice
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
    const checkQuery = 'SELECT id FROM invoices WHERE id = $1 AND user_id = $2';
    const checkResult = await client.query(checkQuery, [invoiceId, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice
    const updateQuery = `
      UPDATE invoices SET
        invoice_number = $1, invoice_date = $2, due_date = $3,
        company_name = $4, company_address = $5, company_email = $6, company_phone = $7,
        client_name = $8, client_address = $9, client_email = $10, client_phone = $11,
        subtotal = $12, tax_rate = $13, tax_amount = $14, total_amount = $15,
        notes = $16, status = $17, updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
    `;

    const updateValues = [
      invoiceNumber, invoiceDate, dueDate,
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      subtotal, taxRate, taxAmount, totalAmount, notes, status || 'draft',
      invoiceId
    ];

    await client.query(updateQuery, updateValues);

    // Delete existing items and insert new ones
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);

    if (items && items.length > 0) {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, description, quantity, price, total)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const item of items) {
        await client.query(itemQuery, [
          invoiceId,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]);
      }
    }

    await client.query('COMMIT');

    res.json({ message: 'Invoice updated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  } finally {
    client.release();
  }
});

// Delete an invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Check if invoice belongs to user and delete
    const deleteQuery = 'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(deleteQuery, [invoiceId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;