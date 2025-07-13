export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchTerm = '', p = '0' } = req.query;

  let incomingPage = parseInt(p, 10);
  if (isNaN(incomingPage) || incomingPage < 0) {
    incomingPage = 0;
  }

  const realPage = incomingPage + 1;

  if (!searchTerm || typeof searchTerm !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid searchTerm' });
  }

  // 🔎 Parse inteligente do searchTerm
  const words = searchTerm.trim().split(/\s+/);
  let artistName = '';
  let cityName = '';
  let year = '';

  for (const word of words) {
    if (/^\d{4}$/.test(word)) {
      year = word;
    } else if (!artistName) {
      artistName += word;
    } else {
      cityName += cityName ? ` ${word}` : word;
    }
  }

  let queryParams = `p=${realPage}`;
  if (artistName) queryParams += `&artistName=${encodeURIComponent(artistName)}`;
  if (cityName) queryParams += `&cityName=${encodeURIComponent(cityName)}`;
  if (year) queryParams += `&year=${year}`;

  const url = `https://api.setlist.fm/rest/1.0/search/setlists?${queryParams}`;
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
