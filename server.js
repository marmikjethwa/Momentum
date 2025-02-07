const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Serve manifest.json explicitly
app.use("/manifest.json", (req, res) => {
    res.sendFile(path.join(__dirname, "manifest.json"));
});
// PostgreSQL Connection
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "todo_app",
    password: "marmiksj", // Replace with your actual password
    port: 5432,
});

// Database initialization queries
const initDB = async () => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL
            )
        `);

        // Create lists table with last_modified
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                name VARCHAR(100) NOT NULL,
                last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE
            )
        `);

        console.log("Database tables initialized successfully");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

// Initialize database tables
initDB();

// Serve index.html as homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// User Registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
            [username, password]
        );
        res.json({ message: "User registered!", userId: result.rows[0].id });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

// User Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT id FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );
        if (result.rows.length) {
            res.json({ message: "Login successful!", userId: result.rows[0].id });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Create a To-Do List
app.post("/lists", async (req, res) => {
    const { userId, name } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO lists (user_id, name, last_modified) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *",
            [userId, name]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Lists for a User
app.get("/lists/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM lists WHERE user_id = $1 ORDER BY last_modified DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update List Name
app.patch("/lists/:listId", async (req, res) => {
    const { listId } = req.params;
    const { name } = req.body;
    try {
        await pool.query(
            "UPDATE lists SET name = $1, last_modified = CURRENT_TIMESTAMP WHERE id = $2",
            [name, listId]
        );
        res.json({ message: "List updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete List
app.delete("/lists/:listId", async (req, res) => {
    const { listId } = req.params;
    try {
        await pool.query("DELETE FROM lists WHERE id = $1", [listId]);
        res.json({ message: "List deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Create a Task
app.post("/tasks", async (req, res) => {
    const { listId, content } = req.body;
    try {
        // First, create the task
        const result = await pool.query(
            "INSERT INTO tasks (list_id, content, is_completed) VALUES ($1, $2, false) RETURNING *",
            [listId, content]
        );
        
        // Then, update the last_modified timestamp of the parent list
        await pool.query(
            "UPDATE lists SET last_modified = CURRENT_TIMESTAMP WHERE id = $1",
            [listId]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Tasks for a List
app.get("/tasks/:listId", async (req, res) => {
    const { listId } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM tasks WHERE list_id = $1 ORDER BY id DESC",
            [listId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update Task Content
app.patch("/tasks/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { content } = req.body;
    try {
        // First, update the task
        await pool.query(
            "UPDATE tasks SET content = $1 WHERE id = $2",
            [content, taskId]
        );
        
        // Then, update the last_modified timestamp of the parent list
        await pool.query(`
            UPDATE lists 
            SET last_modified = CURRENT_TIMESTAMP 
            WHERE id = (SELECT list_id FROM tasks WHERE id = $1)`,
            [taskId]
        );
        
        res.json({ message: "Task updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Toggle Task Completion
app.patch("/tasks/:taskId/toggle", async (req, res) => {
    const { taskId } = req.params;
    try {
        // First, toggle the task completion status
        await pool.query(
            "UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1",
            [taskId]
        );
        
        // Then, update the last_modified timestamp of the parent list
        await pool.query(`
            UPDATE lists 
            SET last_modified = CURRENT_TIMESTAMP 
            WHERE id = (SELECT list_id FROM tasks WHERE id = $1)`,
            [taskId]
        );
        
        res.json({ message: "Task toggled" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete Task
app.delete("/tasks/:taskId", async (req, res) => {
    const { taskId } = req.params;
    try {
        // First, get the list_id for the task
        const listResult = await pool.query(
            "SELECT list_id FROM tasks WHERE id = $1",
            [taskId]
        );
        const listId = listResult.rows[0].list_id;
        
        // Then, delete the task
        await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        
        // Finally, update the last_modified timestamp of the parent list
        await pool.query(
            "UPDATE lists SET last_modified = CURRENT_TIMESTAMP WHERE id = $1",
            [listId]
        );
        
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Start the Server
//const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Database configuration:', {
        host: "localhost",
        database: "todo_app",
        port: 5432
    });
});