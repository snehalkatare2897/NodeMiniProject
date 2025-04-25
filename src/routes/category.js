const express = require("express");
const CategoryRouter = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const authenticateToken =require('../middlewares/auth')



// Create category
CategoryRouter.post("/category/create" ,authenticateToken,async (req, res) => {
  const { name } = req.body;
  const id = uuidv4();

  try {
    await pool.query('INSERT INTO categories (id, name) VALUES ($1, $2)', [id, name]);
    res.status(201).json({ message: 'Category created', id });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      res.status(400).json({ error: 'Category already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// Get all categories
CategoryRouter.get("/category/getall" ,authenticateToken,async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
CategoryRouter.get("/category/:id" ,authenticateToken,async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching category' });
  }
});

// Update category
CategoryRouter.put("/category/:id",authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    await pool.query('UPDATE categories SET name = $1 WHERE id = $2', [name, id]);
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
CategoryRouter.delete("/category/:id" ,authenticateToken,async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
module.exports=CategoryRouter