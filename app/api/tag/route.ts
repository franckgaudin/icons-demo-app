import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_ICON_API_KEY,
})

export async function POST(req: Request) {
  const { name } = await req.json()

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      synonyms: z.array(z.string()),
    }),
    prompt: `Generate 5 synonyms for ${name}`,
  })

  return Response.json({ object })
}
