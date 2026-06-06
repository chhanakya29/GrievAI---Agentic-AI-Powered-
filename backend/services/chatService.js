const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = 'gemini-2.5-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function callGemini(promptText) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
    });

    const url = new URL(GEMINI_URL);
    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text.trim());
        } catch (err) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function chatWithBot(history = [], message = '') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured on the server.');
  }

  const systemInstruction = `You are the helpful AI assistant for the Grievance Redressal Portal. Respond politely and clearly.

If the user mentions a tracking ID and the system has attached complaint data, use that exact data when answering. Do not invent any other complaint details.

If no complaint data exists, tell the user the tracking ID was not found and ask them to verify it.

Keep answers concise and relevant to grievance support.`;

  const historyText = history
    .map((entry) => {
      const entryText = typeof entry.text === 'string'
        ? entry.text
        : typeof entry.parts === 'string'
          ? entry.parts
          : '';
      return `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entryText}`;
    })
    .join('\n');

  const prompt = `${systemInstruction}\n\nConversation History:\n${historyText}\n\nUser: ${message}\nAssistant:`;

  const responseText = await callGemini(prompt);
  return responseText || "I'm sorry, I didn't catch that. Could you please rephrase?";
}

module.exports = { chatWithBot };
