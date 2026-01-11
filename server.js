// A meaningless comment to test deployment
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
// In a real production app, use an environment variable for the connection string.
const connectionString = 'postgresql://helloworld_test_user:Obms9TEpGSbrJjiFG9kewPdrlN9211Cb@dpg-d5i2tqn5r7bs73bph9lg-a/helloworld_test';
const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- Database Initialization ---
const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        client.release();
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// --- API Endpoints ---

// API endpoint for signing up
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const saltRounds = 10;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'User created successfully.', userId: result.rows[0].id });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error('Error signing up user:', err);
        res.status(500).json({ message: 'An error occurred during sign up.' });
    }
});

// API endpoint for logging in
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    initializeDatabase();
    console.log(`Server is running on http://localhost:${PORT}`);
});