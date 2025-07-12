export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { searchTerm = '', page = 1 } = req.query;
  if (!searchTerm) return res.status(400).json({ error: 'Missing searchTerm' });

  const headers = {
    'x-api-key': process.env.SETLISTFM_API_KEY,
    'Accept': 'application/json',
    'User-Agent': "It's Alive (walter.darcie@yahoo.com.br)"
  };

  // Divide os termos da busca
  const terms = searchTerm.trim().split(/\s+/);
  const yearRegex = /^\d{4}$/;

  let artistName = '';
  let cityName = '';
  let venueName = '';
  let tourName = '';
  let year = '';

  for (const term of terms) {
    if (yearRegex.test(term)) {
      year = term;
    } else {
      artistName += term + ' ';
    }
  }

  artistName = artistName.trim();

  // Tenta montar as queries com os campos disponíveis
  const queriesToTry = [];

  if (artistName && year) {
    queriesToTry.push(`artistName=${encodeURIComponent(artistName)}&year=${year}`);
  }

  if (artistName) {
    queriesToTry.push(`artistName=${encodeURIComponent(artistName)}`);
  }

  if (year) {
    queriesToTry.push(`year=${year}`);
  }

  // Outras combinações podem ser adicionadas se quiser...

  let finalResult = null;

  for (const q of queriesToTry) {
    const url = `https://api.setlist.fm/rest/1.0/search/setlists?${q}&p=${parseInt(page) + 1}`;

    try {
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
          queryUsed: q
        };
        break;
      }
    } catch (err) {
      console.error('Erro ao buscar com query:', q, err);
    }
  }

  if (!finalResult) {
    return res.status(404).json({ setlist: [], message: 'No results found' });
  }

  return res.status(200).json(finalResult);
}
