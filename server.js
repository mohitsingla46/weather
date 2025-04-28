const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// OpenWeatherMap API endpoint
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

app.get('/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).send('City parameter required');

        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: city,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.log(error);
        
        res.status(500).send('Error fetching weather data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});