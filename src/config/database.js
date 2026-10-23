require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./src/config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "MediCare API and MySQL are connected"
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});