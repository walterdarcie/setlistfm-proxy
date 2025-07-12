export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (pré-flight do CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { artistName = '', p = '0' } = req.query;

  if (!artistName) {
    return res.status(400).json({ error: 'Missing artistName query parameter' });
  }

  // Corrigir a página: somar +1 porque a API começa do 1, mas o FlutterFlow do 0
  const clientPage = parseInt(p, 10);
  const apiPage = isNaN(clientPage) ? 1 : clientPage + 1;

  try {
    const response = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artistName)}&p=${apiPage}`,
      {
        headers: {
          'x-api-key': process.env.SETLISTFM_API_KEY,
          'Accept': 'application/json',
          'User-Agent': "It's Alive (walter.darcie@yahoo.com.br)", // <- Adicionado aqui
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from Setlist.fm' });
    }

    const data = await response.json();

    // Forçar o campo "setlist" a ser sempre uma lista
    let fixedSetlist = [];

    if (Array.isArray(data.setlist)) {
      fixedSetlist = data.setlist;
    } else if (data.setlist) {
      fixedSetlist = [data.setlist];
    }

    res.status(200).json({
      setlist: fixedSetlist,
      page: apiPage,
      total: data.total ?? 0,
      itemsPerPage: data.itemsPerPage ?? fixedSetlist.length,
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
