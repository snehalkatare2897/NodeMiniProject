const express = require('express');
const pool = require('./src/config/database');
const app = express();
const http = require("http");
const bodyParser = require ('body-parser');
require("dotenv").config();
// const fileUpload = require('express-fileupload');
app.use(express.json());
// app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


const userRouter = require("./src/routes/user");
const productRouter = require("./src/routes/product");
const CategoryRouter = require("./src/routes/category");

app.use("/",userRouter);
app.use("/", productRouter);
app.use("/", CategoryRouter);
// console.log(pool.connect())

const server = http.createServer(app).listen(7777, () => {
          console.log("Server is successfully listening on port 7777...");
        });
     
 