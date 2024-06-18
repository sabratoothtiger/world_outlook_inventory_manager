const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.dymo')) {
            res.setHeader('Content-Type', 'application/xml');
        }
    }
}));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});