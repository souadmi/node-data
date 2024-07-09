// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const connectDbRouter = require('./routes/connect-db');
// const path = require('path');
// const app = express();


// app.use(bodyParser.json());
// app.use('/api', connectDbRouter);


// app.use(express.json());

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//     next();
// });

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); 
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//     res.setHeader('Access-Control-Allow-Credentials', 'true'); 
//     next();
// });

// mongodb+srv://souad:Souad2005@first.vbhwbxb.mongodb.net/?retryWrites=true&w=majority&appName=First



const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const connectDbRouter = require('./routes/connect-db');
const userRoutes = require('./routes/userRoutes')
const cors = require('cors');
const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
    credentials: true,
};

app.use(cors(corsOptions));

mongoose.connect('mongodb+srv://souadmhamdi:Souad2005@visualai.57jkh2d.mongodb.net/?retryWrites=true&w=majority&appName=VisualAi')
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.log('Connexion à MongoDB échouée !', err));

app.use(bodyParser.json());
app.use('/api', connectDbRouter);
app.use('/api/auth', userRoutes);

app.use(express.json());


module.exports =app;
