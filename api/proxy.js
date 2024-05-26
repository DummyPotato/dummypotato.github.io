const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Bad Request: Missing URL parameter');
    }

    try {
        console.log(`Launching Puppeteer for URL: ${url}`);
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const content = await page.content();
        await browser.close();
        console.log(`Fetched content for URL: ${url}`);

        const $ = cheerio.load(content);

        // Rewrite URLs for CSS, JS, image resources, and internal links
        $('link[href], script[src], img[src], a[href]').each((index, element) => {
            const attribute = element.tagName === 'link' || element.tagName === 'a' ? 'href' : 'src';
            const src = $(element).attr(attribute);
            if (src && !src.startsWith('http') && !src.startsWith('https') && !src.startsWith('mailto:')) {
                $(element).attr(attribute, new URL(src, url).href);
            }
        });

        // Add base tag to head to handle relative URLs
        $('head').prepend(`<base href="${url}">`);

        // Rewrite internal links to use the proxy
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href && !href.startsWith('http') && !href.startsWith('https') && !href.startsWith('mailto:')) {
                $(element).attr('href', `/proxy?url=${encodeURIComponent(new URL(href, url).href)}`);
            }
        });

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.send($.html());
    } catch (error) {
        console.error('Error fetching URL:', error.message, error.stack);
        res.status(500).send(`Error fetching the URL: ${error.message}`);
    }
});

module.exports = app;
