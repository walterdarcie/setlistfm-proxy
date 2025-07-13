export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchTerm = '', p = 0 } = req.query;

  let incomingPage = parseInt(p);
  if (isNaN(incomingPage) || incomingPage < 0) {
    incomingPage = 0;
  }

  const realPage = incomingPage + 1;

  // ⚠️ Sempre usa searchTerm como artistName
  if (!searchTerm || typeof searchTerm !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid searchTerm' });
  }

  const url = `https://api.setlist.fm/rest/1.0/search/setlists?p=${realPage}&artistName=${encodeURIComponent(searchTerm)}`;
  console.log('➡️ Requesting Setlist.fm URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': process.env.SETLISTFM_API_KEY,
        'Accept': 'application/json',
        'User-Agent': "It's Alive (walter.darcie@yahoo.com.br)"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Failed to fetch data from Setlist.fm',
        details: errorText
      });
    }

    const data = await response.json();

    let fixedSetlist = [];
    if (Array.isArray(data.setlist)) {
      fixedSetlist = data.setlist;
    } else if (data.setlist) {
      fixedSetlist = [data.setlist];
    }

    return res.status(200).json({
      setlist: fixedSetlist,
      page: data.page ?? realPage,
      total: data.total ?? 0,
      itemsPerPage: data.itemsPerPage ?? fixedSetlist.length
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
