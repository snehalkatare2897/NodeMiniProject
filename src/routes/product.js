const express = require("express");
const productRouter = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const csv = require('csv-parser');
const upload = require('../middlewares/fileupload');
const authenticateToken = require('../middlewares/auth')
const { format } = require('date-fns');
const { Writable } = require('stream');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');




// Create product
// productRouter.post("/product/create", authenticateToken,async (req, res) => {
//   const { name, price, category_id } = req.body;
//   const imagefiles = req.files.image;
//   const id = uuidv4();

//   try {
//     await pool.query(
//       'INSERT INTO products (id, name, image, price, category_id) VALUES ($1, $2, $3, $4, $5)',
//       [id, name, imagefiles.data, price, category_id]
//     );
//     res.status(201).json({ message: 'Product created', id });
//   } catch (err) {
//     // res.status(500).json({ error: 'Failed to create product' });
//     res.status(500).send(err.message);

//   }
// });

productRouter.post("/product/create", authenticateToken, async (req, res) => {
  const { name, image, price, category_id } = req.body;
  console.log(name, price, category_id, image)
  const id = uuidv4();

  try {
    await pool.query(
      'INSERT INTO productsbulk (id, name, image, price, category_id) VALUES ($1, $2, $3, $4, $5)',
      [id, name, image, price, category_id]
    );
    res.status(201).json({ message: 'Product created', id });
  } catch (err) {
    // res.status(500).json({ error: 'Failed to create product' });
    res.status(500).send(err.message);

  }
});

// Get all products (with category name  product filter,sorting and limit)
productRouter.get("/product/getall", async (req, res) => {
  try {
    let { category, name, limit } = req.body;
    console.log(name)
    if (category) {
      category = ` AND c.name ='${category}'`
    }
    if (name) {
      name = ` AND p.name ='${name}'`
    }

    if (limit) {
      limit = `limit ${limit}`
    }

    // const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT p.id, p.name, p.image, p.price, c.name AS category
      FROM productsbulk p
      JOIN categories c ON p.category_id = c.id
      where 1=1 ${category} ${name} 
      ORDER BY  p.price desc ${limit}`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all products
productRouter.get("/product/getallProducts", async (req, res) => {
  try {
    // const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT p.id, p.name, p.image, p.price, c.name AS category
      FROM productsbulk p
      JOIN categories c ON p.category_id = c.id`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
productRouter.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.image, p.price, c.name AS category
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Update product
productRouter.put("/product/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;
  const imagefiles = req.files.image;


  try {
    await pool.query(
      'UPDATE products SET name = $1, image = $2, price = $3, category_id = $4 WHERE id = $5',
      [name, imagefiles.data, price, category_id, id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
productRouter.delete("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// upload product
productRouter.post("/bulk-upload", authenticateToken, upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const products = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const { name, image, price, category_id } = row;
        if (name && price && category_id) {
          products.push([uuidv4(), name, image, parseFloat(price), category_id]);
        }
      })
      .on('end', async () => {
        if (products.length === 0) {
          return res.status(400).json({ error: 'No valid product data found' });
        }

        const insertQuery = `
          INSERT INTO productsBulk (id, name, image, price, category_id)
          VALUES ${products.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(',')}
        `;

        const values = products.flat();

        try {
          await pool.query(insertQuery, values);
          res.json({ message: `${products.length} products uploaded successfully` });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Bulk insert failed' });
        }
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing CSV file' });
  }
});

//

// CSV Report
productRouter.get("/downloadCSV", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productsbulk');

    const csvFields = ['id', 'name', 'image','price', 'category_id'];
    const parser = new Parser({ fields: csvFields });
    const csvData = parser.parse(result.rows);
    const fileName = `products_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).end(csvData);
  } catch (err) {
    res.status(500).json({ error: 'CSV download failed', details: err });
  }
});




module.exports = productRouter

