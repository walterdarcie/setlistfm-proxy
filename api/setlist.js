export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Resposta rápida para preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parâmetros da query
  const { searchTerm = '', artistName = '', p = 0 } = req.query;

  // Corrige e garante número da página
  let incomingPage = parseInt(p);
  if (isNaN(incomingPage) || incomingPage < 0) {
    incomingPage = 0;
  }

  // A API do Setlist.fm começa da página 1
  const realPage = incomingPage + 1;

  // Monta a query de busca
  let queryParam = '';
  if (searchTerm) {
    queryParam = `&searchName=${encodeURIComponent(searchTerm)}`;
  } else if (artistName) {
    queryParam = `&artistName=${encodeURIComponent(artistName)}`;
  } else {
    return res.status(400).json({ error: 'Missing searchTerm or artistName parameter' });
  }

  const url = `https://api.setlist.fm/rest/1.0/search/setlists?p=${realPage}${queryParam}`;
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

    // Força 'setlist' a ser uma lista
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
