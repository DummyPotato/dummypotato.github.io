const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Bad Request: Missing URL parameter');
    }

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Rewrite URLs for CSS, JS, and image resources
        $('link[href], script[src], img[src]').each((index, element) => {
            const attribute = element.tagName === 'link' ? 'href' : 'src';
            const src = $(element).attr(attribute);
            if (src && !src.startsWith('http') && !src.startsWith('https')) {
                $(element).attr(attribute, new URL(src, url).href);
            }
        });

        // Add base tag to head to handle relative URLs
        $('head').prepend(`<base href="${url}">`);

        res.send($.html());
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send('Error fetching the URL');
    }
});

module.exports = app;
