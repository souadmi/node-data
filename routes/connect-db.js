const express = require('express');
const mysql = require('mysql');
const { Client } = require('pg');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
let currentConnection = null;

// router.post('/connect-db', async (req, res) => {
//     const { type, url, user, password } = req.body;
//     if (!type || !url || (type !== 'sqlite' && (!user || !password))) {
//         return res.status(400).send('champs manquants');
//     }
//     try {
//         switch (type) {
//             case 'mysql':
//                 currentConnection = await mysql.createConnection({
//                     host: url,
//                     user: user,
//                     password: password
//                 });
//                 return res.send('connexion a mysql reussi');
//             case 'postgres':
//                 currentConnection = new Client({
//                     connectionString: url,
//                     user: user,
//                     password: password
//                 });
//                 await currentConnection.connect();
//                 return res.send('connexion a postgres reussi');
//             case 'mongodb':
//                 await mongoose.connect(url, {
//                     user: user,
//                     pass: password,
//                 });
//                 currentConnection = mongoose.connection;
//                 return res.send('connexion a mongodb reussi');
//             case 'sqlite':
//                 currentConnection = new sqlite3.Database(url, sqlite3.OPEN_READWRITE, (err) => {
//                     if (err) {
//                         return res.status(500).send('erreur de connexion SQLite');
//                     }
//                 });
//                 return res.send('connexion a sqlite reussi');
//             default:
//                 return res.status(400).send('Type de base de données non supporté');
//         }
//     } catch (error) {
//         console.error('erreur de connexion à la base de données:', error);
//         return res.status(500).send('erreur de connexion à la base de données');
//     }
// });


router.post('/connect-db', async (req, res) => {
    const { type, url, user, password, userId } = req.body;
    if (!type || !url || (type !== 'sqlite' && (!user || !password))) {
        return res.status(400).send('Champs manquants');
    }

    try {
        // Enregistrer la base de données dans la collection Database
        const newDatabase = new Database({ type, url, user, password });
        await newDatabase.save();

        // Ajouter la référence de la base de données à l'utilisateur
        await User.findByIdAndUpdate(userId, { $push: { databases: newDatabase._id } });

        // Connecter à la base de données
        switch (type) {
            case 'mysql':
                currentConnection = await mysql.createConnection({
                    host: url,
                    user: user,
                    password: password
                });
                return res.send('Connexion à MySQL réussie');
            case 'postgres':
                currentConnection = new Client({
                    connectionString: url,
                    user: user,
                    password: password
                });
                await currentConnection.connect();
                return res.send('Connexion à PostgreSQL réussie');
            case 'mongodb':
                await mongoose.connect(url, {
                    user: user,
                    pass: password,
                });
                currentConnection = mongoose.connection;
                return res.send('Connexion à MongoDB réussie');
            case 'sqlite':
                currentConnection = new sqlite3.Database(url, sqlite3.OPEN_READWRITE, (err) => {
                    if (err) {
                        return res.status(500).send('Erreur de connexion SQLite');
                    }
                });
                return res.send('Connexion à SQLite réussie');
            default:
                return res.status(400).send('Type de base de données non supporté');
        }
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error);
        return res.status(500).send('Erreur de connexion à la base de données');
    }
});




router.get('/tables', async (req, res) => {
    if (!currentConnection) {
        return res.status(400).send('Aucune connexion active');
    }

    try {
        switch (currentConnection.constructor.name) {
            //mysql
            case 'Connection':
                const [rows] = await currentConnection.query('SHOW TABLES');
                const tables = rows.map(row => Object.values(row)[0]);
                res.json(tables.slice(0, 5));
                break;
            //postgres
            case 'Client':
                const result = await currentConnection.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
                res.json(result.rows.map(row => row.table_name).slice(0, 5));
                break;
            //mongodb
            case 'NativeConnection': 
                const collections = await currentConnection.db.listCollections().toArray();
                res.json(collections.map(col => col.name).slice(0, 5));
                break;
            //sqlite
            case 'Database':
                currentConnection.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                    if (err) {
                        res.status(500).send('Erreur lors de la récupération des tables SQLite');
                    } else {
                        res.json(rows.map(row => row.name).slice(0, 5));
                    }
                });
                break;
            default:
                res.status(400).send('Type de connexion non supporté');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des tables:', error);
        res.status(500).send('Erreur lors de la récupération des tables');
    }
});

router.get('/tables/:tableName', async (req, res) => {
    if (!currentConnection) {
        return res.status(400).send('Aucune connexion active');
    }

    const tableName = req.params.tableName;

    try {
        switch (currentConnection.constructor.name) {
            //mysql
            case 'Connection':
                const [rows] = await currentConnection.query(`SELECT * FROM \`${tableName}\``);
                res.json(rows);
                break;
            //postgres
            case 'Client':
                const result = await currentConnection.query(`SELECT * FROM "${tableName}"`);
                res.json(result.rows);
                break;
            //mongodb
            case 'NativeConnection':
                const collection = currentConnection.db.collection(tableName);
                const documents = await collection.find({}).limit(10).toArray();
                res.json(documents);
                break;
            //sqlite
            case 'Database':
                currentConnection.all(`SELECT * FROM "${tableName}"`, (err, rows) => {
                    if (err) {
                        res.status(500).send('Erreur lors de la récupération des lignes SQLite');
                    } else {
                        res.json(rows);
                    }
                });
                break;
            default:
                res.status(400).send('Type de connexion non supporté');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des lignes:', error);
        res.status(500).send('Erreur lors de la récupération des lignes');
    }
});
router.get('/tables/:tableName/column/:columnName', async (req, res) => {
    if (!currentConnection) {
        return res.status(400).send('Aucune connexion active');
    }

    const { tableName, columnName } = req.params;

    try {
        switch (currentConnection.constructor.name) {
            case 'Connection': // MySQL
                const [rows] = await currentConnection.query(`SELECT \`${columnName}\` FROM \`${tableName}\``);
                res.json(rows.map(row => row[columnName]));
                break;
            case 'Client': // PostgreSQL
                const result = await currentConnection.query(`SELECT "${columnName}" FROM "${tableName}"`);
                res.json(result.rows.map(row => row[columnName]));
                break;
            case 'NativeConnection': // MongoDB
                const collection = currentConnection.db.collection(tableName);
                const documents = await collection.find({}).project({ [columnName]: 1, _id: 0 }).limit(10).toArray();
                res.json(documents.map(doc => doc[columnName]));
                break;
            case 'Database': // SQLite
                currentConnection.all(`SELECT "${columnName}" FROM "${tableName}"`, (err, rows) => {
                    if (err) {
                        res.status(500).send('Erreur lors de la récupération de la colonne SQLite');
                    } else {
                        res.json(rows.map(row => row[columnName]));
                    }
                });
                break;
            default:
                res.status(400).send('Type de connexion non supporté');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la colonne:', error);
        res.status(500).send('Erreur lors de la récupération de la colonne');
    }
});
module.exports = router;
