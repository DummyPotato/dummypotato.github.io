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
        const response = await axios.get(url);
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

        res.send($.html());
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send('Error fetching the URL');
    }
});

module.exports = app;
