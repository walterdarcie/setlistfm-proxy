export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { searchTerm = '', page = 1 } = req.query;
  if (!searchTerm) return res.status(400).json({ error: 'Missing searchTerm' });

  const fields = ['artistName', 'cityName', 'venueName', 'tourName', 'year'];

  const headers = {
    'x-api-key': process.env.SETLISTFM_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'It’s Alive (walter.darcie@yahoo.com.br)'
  };

  let finalResult = null;

  for (const field of fields) {
    const url = `https://api.setlist.fm/rest/1.0/search/setlists?${field}=${encodeURIComponent(searchTerm)}&p=${parseInt(page) + 1}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) continue;

    const data = await response.json();
    let fixedSetlist = [];

    if (Array.isArray(data.setlist)) {
      fixedSetlist = data.setlist;
    } else if (data.setlist) {
      fixedSetlist = [data.setlist];
    }

    if (fixedSetlist.length > 0) {
      finalResult = {
        setlist: fixedSetlist,
        page: data.page ?? 1,
        total: data.total ?? 0,
        itemsPerPage: data.itemsPerPage ?? fixedSetlist.length,
        fieldMatched: field
      };
      break;
    }
  }

  if (!finalResult) {
    return res.status(404).json({ setlist: [], message: 'No results found' });
  }

  res.status(200).json(finalResult);
}
