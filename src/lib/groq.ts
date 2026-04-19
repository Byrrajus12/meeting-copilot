import Groq from 'groq-sdk'

export function getGroqClient(apiKey: string) {
  return new Groq({ apiKey })
}