const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./routes/auth');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          )
        `, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table created or already exists.');
            }
        });
        db.run(`
          CREATE TABLE IF NOT EXISTS fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            culture TEXT,
            area REAL,
            location TEXT,
            humus REAL,
            plowLayerDepth REAL,
            soilDensity REAL,
            phSalt REAL
          )
        `, (err) => {
            if (err) {
                console.error('Error creating fields table:', err.message);
            } else {
                console.log('Fields table created or already exists.');
            }
        });
    }
});

app.set('db', db);

app.get('/api/fields', (req, res) => {
    db.all("SELECT * FROM fields", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/fields', (req, res) => {
    const newField = req.body;
    db.run(`INSERT INTO fields (culture, area, location, humus, plowLayerDepth, soilDensity, phSalt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newField.culture, newField.area, newField.location, newField.humus, newField.plowLayerDepth, newField.soilDensity, newField.phSalt],
        function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('Added new field:', newField);
            res.status(201).json({ id: this.lastID, ...newField });
        });
});


app.use('/api', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});