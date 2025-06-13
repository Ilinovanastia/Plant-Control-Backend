const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        db.get("SELECT id FROM users WHERE username = ?", [username], async (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ msg: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ msg: 'Failed to register user' });
                }

                const token = jwt.sign(
                    { id: this.lastID },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                res.status(201).json({ token });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    db.get("SELECT id, password FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Database error' });
        }

        if (!row) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        const passwordMatch = await bcrypt.compare(password, row.password);

        if (!passwordMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: row.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    });
});

module.exports = router;