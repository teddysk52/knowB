const express = require('express');
const cors = require('cors');
const { computeRoute } = require('./route');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/route', async (req, res) => {
  try {
    const { start, end, profile, preferences } = req.body;
    if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
      return res.status(400).json({ error: 'start and end with lat/lng are required' });
    }
    const validProfiles = ['wheelchair', 'senior', 'tourist', 'standard'];
    const safeProfile = validProfiles.includes(profile) ? profile : 'standard';
    const result = await computeRoute(start, end, safeProfile, preferences || {});
    res.json(result);
  } catch (err) {
    console.error('Route computation error:', err.message);
    res.status(500).json({ error: 'Failed to compute route' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`KnowB API running on http://localhost:${PORT}`);
});
