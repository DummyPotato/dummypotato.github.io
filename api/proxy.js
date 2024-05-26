const axios = require('axios');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Bad Request: Missing URL parameter');
    }

    try {
        const response = await axios.get(url);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send('Error fetching the URL');
    }
};
