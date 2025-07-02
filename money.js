const express = require('express');
const path = require('path');
const dotenv = require('dotenv'); 
dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.listen(PORT, () => console.log(`Server Running on port ${PORT}`));