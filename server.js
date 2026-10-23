
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./src/config/database");

const app = express();

app.use(cors());
app.use(express.json());

// Serve your HTML and CSS files
app.use(express.static(__dirname));

// Test API and MySQL connection
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "success",
            message: "Pharmacy API and MySQL are connected"
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

// GET: View all medicines
app.get("/api/medicines", async (req, res) => {
    try {
        const [medicines] = await db.query(
            "SELECT * FROM medicines ORDER BY name"
        );

        res.json(medicines);
    } catch (error) {
        console.error("Medicine error:", error.message);
        res.status(500).json({
            message: "Failed to fetch medicines"
        });
    }
});

// POST: Add a new medicine
app.post("/api/medicines", async (req, res) => {
    try {
        const {
            name,
            barcode,
            category,
            manufacturer,
            price,
            quantity
        } = req.body;

        if (!name || price == null || quantity == null) {
            return res.status(400).json({
                message: "Name, price and quantity are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO medicines
             (name, barcode, category, manufacturer, price, quantity)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                barcode || null,
                category || null,
                manufacturer || null,
                price,
                quantity
            ]
        );

        res.status(201).json({
            message: "Medicine added successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Add medicine error:", error.message);
        res.status(500).json({
            message: "Failed to add medicine",
            error: error.code || "UNKNOWN_ERROR"
        });
    }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await db.query("SELECT 1");

        app.listen(PORT, () => {
            console.log(`Pharmacy server running at http://localhost:${PORT}`);
            console.log("MySQL connection successful");
        });
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        console.log("Check MySQL Server and your .env settings.");
    }
}

startServer();
