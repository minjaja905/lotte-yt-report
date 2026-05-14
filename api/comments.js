export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { videoId, maxResults = '200' } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey)  return res.status(500).json({ error: 'YOUTUBE_API_KEY not set in environment' });
  if (!videoId) return res.status(400).json({ error: 'videoId query param is required' });

  const limit = Math.min(parseInt(maxResults, 10) || 200, 500);
  const comments = [];
  let pageToken = '';

  try {
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('videoId', videoId);
      url.searchParams.set('maxResults', '100');
      url.searchParams.set('order', 'relevance');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const r = await fetch(url.toString());
      if (!r.ok) {
        const err = await r.json();
        return res.status(r.status).json({ error: err?.error?.message || 'YouTube API error' });
      }

      const data = await r.json();

      for (const item of (data.items || [])) {
        const top = item.snippet.topLevelComment.snippet;
        comments.push({
          text:    top.textOriginal,
          author:  top.authorDisplayName,
          likes:   top.likeCount    || 0,
          replies: item.snippet.totalReplyCount || 0,
          date:    top.publishedAt,
          type:    '원댓글',
        });
      }

      pageToken = data.nextPageToken || '';
    } while (pageToken && comments.length < limit);

    return res.status(200).json({ comments, total: comments.length, videoId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
