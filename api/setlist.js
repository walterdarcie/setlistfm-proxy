export default async function handler(req, res) {
  const { artistName } = req.query;

  if (!artistName) {
    return res.status(400).json({ error: 'artistName is required' });
  }

  const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${artistName}`, {
    headers: {
      'x-api-key': 'SUA_API_KEY_AQUI',
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}
