// A meaningless comment to test deployment
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory user store (replace with a database in a real application)
const users = [];

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// API endpoint for signing up
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: 'Username already exists.' });
    }

    const newUser = { username, password };
    users.push(newUser);

    res.status(201).json({ message: 'User created successfully.' });
});

// API endpoint for logging in
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.status(200).json({ message: 'Login successful.' });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
