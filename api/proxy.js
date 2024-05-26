const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/api/puppeteer', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Bad Request: Missing URL parameter');
    }

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const content = await page.content();
        await browser.close();

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.send(content);
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send(`Error fetching the URL: ${error.message}`);
    }
});

module.exports = app;
