import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const entries = await kv.get('bursch-entries') || [];
      res.status(200).json({ entries });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  } else if (req.method === 'POST') {
    const { action, entry, id } = req.body;

    try {
      let entries = await kv.get('bursch-entries') || [];

      if (action === 'save') {
        const existingIndex = entries.findIndex(e => e.id === entry.id);
        if (existingIndex >= 0) {
          entries[existingIndex] = entry;
        } else {
          entries.push(entry);
        }
      } else if (action === 'delete') {
        entries = entries.filter(e => e.id !== id);
      }

      await kv.set('bursch-entries', entries);
      res.status(200).json({ success: true, entries });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update entries' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
