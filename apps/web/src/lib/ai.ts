import OpenAI from 'openai'

function getClient() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is missing')
  return new OpenAI({ apiKey: key })
}

export async function aiChat(system: string, user: string) {
  const ai = getClient()
  const res = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2
  })
  return { text: res.choices[0]?.message?.content ?? '', usage: res.usage }
}
