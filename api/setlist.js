export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchTerm = '', artistName = '', p = 0 } = req.query;

  let incomingPage = parseInt(p);
  if (isNaN(incomingPage) || incomingPage < 0) {
    incomingPage = 0;
  }

  const realPage = incomingPage + 1;

  let queryParam = '';
  if (searchTerm) {
    queryParam = `&searchName=${encodeURIComponent(searchTerm)}`;
  } else if (artistName) {
    queryParam = `&artistName=${encodeURIComponent(artistName)}`;
  } else {
    return res.status(400).json({ error: 'Missing searchTerm or artistName parameter' });
  }

  try {
    const response = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?p=${realPage}${queryParam}`,
      {
        headers: {
          'x-api-key': process.env.SETLISTFM_API_KEY,
          'Accept': 'application/json',
          'User-Agent': "It's Alive (walter.darcie@yahoo.com.br)"
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from Setlist.fm' });
    }

    const data = await response.json();

    let fixedSetlist = [];
    if (Array.isArray(data.setlist)) {
      fixedSetlist = data.setlist;
    } else if (data.setlist) {
      fixedSetlist = [data.setlist];
    }

    res.status(200).json({
      setlist: fixedSetlist,
      page: data.page ?? realPage,
      total: data.total ?? 0,
      itemsPerPage: data.itemsPerPage ?? fixedSetlist.length,
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
