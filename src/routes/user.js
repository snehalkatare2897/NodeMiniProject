const express = require("express");
const userRouter = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
// const prisma = require('../../prisma/prismaClient');
const authenticateToken =require('../middlewares/auth')

// Create User
userRouter.post("/user/signup",async (req, res) => {
    console.log(req.body)
  const { email, password } = req.body;
  console.log(email,password)
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await pool.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [id, email, hashedPassword]
    );
    // const user = await prisma.user.create({
    //   data: { email, password: hashedPassword },
    // });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

//  User login
userRouter.post("/user/login",async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, 'snehal@1234', {
      expiresIn: '1h'
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});


// Get All Users
userRouter.get("/user/getall",authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get User by ID
userRouter.get("/user/:id", authenticateToken,async (req, res) => {
  const id  = req.params.id;
  try {
    console.log(`SELECT id, email FROM users WHERE id = $1`,[id])
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1',[id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update User
userRouter.put("/user/update",authenticateToken,async (req, res) => {

  const { email, password,id } = req.body;
  console.log(`UPDATE users SET email = $1, password = $2 WHERE id = $3`,
      [email, password, id])

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET email = $1, password = $2 WHERE id = $3',
      [email, hashedPassword, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete User
userRouter.delete("/user/:id", authenticateToken,async (req, res) => {
  const { id } = req.params.id
  console.log("id",id)

  try {
    await pool.query('DELETE FROM users WHERE id = $1',[id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


module.exports= userRouter
