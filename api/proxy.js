const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Bad Request: Missing URL parameter');
    }

    try {
        console.log(`Fetching URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            },
            maxRedirects: 5 // Follow redirects
        });

        const $ = cheerio.load(response.data);

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
        console.error('Error fetching URL:', error.message, error.response ? error.response.data : '');
        res.status(500).send(`Error fetching the URL: ${error.message}`);
    }
});

module.exports = app;
