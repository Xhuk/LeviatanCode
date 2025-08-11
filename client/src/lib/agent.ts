export async function agent(messages: any[], model?: string) {
  const r = await fetch('/api/agent', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ messages, model })
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}