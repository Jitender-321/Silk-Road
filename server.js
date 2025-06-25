const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const querystring = require("querystring");

// In-memory storage for marketplace items (start fresh)
let marketplaceItems = [];
let itemIdCounter = 1;

const PORT = 5000;
const HOST = "0.0.0.0";

// MIME types for different file extensions
const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
};

// Helper function to serve static files
function serveStaticFile(filePath, res) {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("File not found");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error: " + err.code);
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
}

// Helper function to parse POST data
function parsePostData(req, callback) {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });
    req.on("end", () => {
        callback(body);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    );

    if (method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    // API Routes
    if (pathname === "/api/items" && method === "GET") {
        // Get all marketplace items
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(marketplaceItems));
        return;
    }

    if (pathname === "/api/items" && method === "POST") {
        // Add new item to marketplace
        parsePostData(req, (body) => {
            try {
                const itemData = JSON.parse(body);

                // Validate required fields
                if (
                    !itemData.title ||
                    !itemData.description ||
                    !itemData.price ||
                    !itemData.location ||
                    !itemData.meetingTime
                ) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({ error: "Missing required fields" }),
                    );
                    return;
                }

                // Create new item
                const newItem = {
                    id: itemIdCounter++,
                    title: itemData.title.trim(),
                    description: itemData.description.trim(),
                    price: parseFloat(itemData.price),
                    location: itemData.location.trim(),
                    meetingTime: itemData.meetingTime.trim(),
                    image: itemData.image || null,
                    dateAdded: new Date().toISOString(),
                    seller: itemData.seller || "Anonymous",
                };

                marketplaceItems.unshift(newItem); // Add to beginning of array

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(newItem));
            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON data" }));
            }
        });
        return;
    }

    // Serve static files
    let filePath;
    if (pathname === "/") {
        filePath = path.join(__dirname, "index.html");
    } else {
        filePath = path.join(__dirname, pathname);
    }

    serveStaticFile(filePath, res);
});

server.listen(PORT, HOST, () => {
    console.log(
        `Silk Road Marketplace server running at http://${HOST}:${PORT}/`,
    );
    console.log("Access the marketplace at: http://localhost:5000");
});
