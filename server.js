const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/nearbysearch/:location/:type', async (req, res) => {
    const apiKey = 'AIzaSyA8Y-N6cuyEaNR2zF2OGwst02PQxmD1Big';

    const location = req.params.location;
    const type = req.params.type;
    const radius = '50000';

    if (!location || !radius || !type) {
        return res.status(400).send({ error: 'Missing required input parameters: location, radius, type' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const filteredResults = response.data.results.filter(place => place.types.includes(type));
        res.send(filteredResults);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error fetching data from Google Places API' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
