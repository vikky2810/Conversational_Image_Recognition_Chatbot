import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const initializeGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }
  return new GoogleGenerativeAI(apiKey)
}

export async function POST(req: NextRequest) {
  try {
    const genAI = initializeGeminiAI()
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    // Use gemini-pro for text-only messages and gemini-pro-vision for images
    const modelName =
      typeof lastMessage.content !== "string" && lastMessage.content.image_url
        ? "gemini-1.5-flash" // Updated to Gemini 1.5 Flash
        : "gemini-1.5-flash" // You can use "gemini-1.5-pro" for better responses

    const model = genAI.getGenerativeModel({ model: modelName })

    // Format the conversation history for the model
    const prompt = messages
      .map((msg: any) => (typeof msg.content === "string" ? msg.content : `${msg.content.text || ""}`))
      .join("\n")

    const content: any[] = [prompt]

    // Handle image if present
    if (typeof lastMessage.content !== "string" && lastMessage.content.image_url) {
      try {
        const imageResponse = await fetch(lastMessage.content.image_url)
        if (!imageResponse.ok) {
          throw new Error("Failed to fetch image")
        }

        const imageBuffer = await imageResponse.arrayBuffer()

        content.push({
          inlineData: {
            data: Buffer.from(imageBuffer).toString("base64"),
            mimeType: "image/jpeg",
          },
        })
      } catch (imageError) {
        console.error("Image processing error:", imageError)
        throw new Error("Failed to process image")
      }
    }

    try {
      const result = await model.generateContent(content)
      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new Error("Empty response from Gemini API")
      }

      return NextResponse.json({ text })
    } catch (modelError: any) {
      console.error("Model generation error:", modelError)
      return NextResponse.json({ error: modelError.message || "Failed to generate response" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

