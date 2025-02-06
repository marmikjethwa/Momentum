const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));  // Serve frontend files

// PostgreSQL Connection
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "todo_app",
    password: "marmiksj", // Replace with actual password
    port: 5432,
});

// Serve index.html as homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// **API Routes**
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
            "INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING *",
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
        const result = await pool.query("SELECT * FROM lists WHERE user_id = $1", [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Create a Task
app.post("/tasks", async (req, res) => {
    const { listId, content } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO tasks (list_id, content, is_completed) VALUES ($1, $2, false) RETURNING *",
            [listId, content]
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
        const result = await pool.query("SELECT * FROM tasks WHERE list_id = $1", [listId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update Task (Mark as Completed)
app.put("/tasks/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { is_completed } = req.body;
    try {
        await pool.query("UPDATE tasks SET is_completed = $1 WHERE id = $2", [is_completed, taskId]);
        res.json({ message: "Task updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete Task
app.delete("/tasks/:taskId", async (req, res) => {
    const { taskId } = req.params;
    try {
        await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Start the Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
// Add last_modified column to lists table in your database
// ALTER TABLE lists ADD COLUMN last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

// Update list name
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

// Update task content
app.patch("/tasks/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { content } = req.body;
    try {
        await pool.query(
            "UPDATE tasks SET content = $1 WHERE id = $2",
            [content, taskId]
        );
        res.json({ message: "Task updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});