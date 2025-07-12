export default async function handler(req, res) {
  try {
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
      'User-Agent': "It's Alive (walter.darcie@yahoo.com.br)" // ✅ corrigido aqui
    };

    let finalResult = null;

    for (const field of fields) {
      const url = `https://api.setlist.fm/rest/1.0/search/setlists?${field}=${encodeURIComponent(searchTerm)}&p=${parseInt(page) + 1}`;
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(`Erro ao buscar com o campo ${field}: ${response.status}`);
        continue;
      }

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

    return res.status(200).json(finalResult);

  } catch (error) {
    console.error('Erro interno no proxy:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
