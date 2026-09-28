const base = process.env.HERMES_BASE_URL?.replace(/\/$/, '');
const key = process.env.HERMES_API_KEY;

try {
  if (!base || !key) throw new Error('Hermes gateway is not configured.');

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'hermes-agent',
      stream: false,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with one short word.' }],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Hermes returned ${response.status}`);

  const result = await response.json();
  if (result.hermes?.failed || result.choices?.[0]?.finish_reason === 'error' || !result.choices?.[0]?.message?.content) {
    throw new Error(result.hermes?.error_code || 'Model did not answer');
  }
  console.log('Hermes and the model responded successfully.');
} catch (error) {
  console.error(`Model check failed: ${error.message}`);
  process.exitCode = 1;
}
