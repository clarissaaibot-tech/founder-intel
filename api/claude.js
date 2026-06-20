// Vercel Serverless Function — /api/claude
// 前端调用这个,它在服务器端用你的密钥去调 Anthropic,密钥永远不会到浏览器。
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: '服务器缺少 ANTHROPIC_API_KEY 环境变数,请到 Vercel 项目设定里加上。' });
    return;
  }

  try {
    // Vercel 通常会自动解析 JSON body;万一是字串就手动解析一次
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const prompt = body && body.prompt;
    const useSearch = body && body.useSearch;
    if (!prompt) {
      res.status(400).json({ error: '缺少 prompt' });
      return;
    }

    const payload = {
      model: 'claude-haiku-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    };
    if (useSearch) {
      payload.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    // 原样把 Anthropic 的回应传回前端(前端只读 data.content)
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
