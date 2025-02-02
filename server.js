const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/maps-proxy', async (req, res) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/js', {
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        libraries: req.query.libraries,
        callback: req.query.callback,
        v: 'weekly'
      }
    });
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching Maps API');
  }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
