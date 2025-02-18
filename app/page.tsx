"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "./image-upload"
import Image from "next/image"
import { AlertCircle } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string | { text: string; image_url: string }
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setError(null) // Clear any previous errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input && !imageUrl) return

    setIsTyping(true)
    setError(null)

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: imageUrl ? { text: input || "What do you see in this image?", image_url: imageUrl } : input,
    }

    try {
      // Add user message immediately
      setMessages((prev) => [...prev, newMessage])

      // Clear input and image
      setInput("")
      setImageUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMessage] }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from API")
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.text,
        },
      ])
    } catch (error) {
      console.error("Error in chat:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatContainerRef]) //Corrected dependency

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Image Recognition Chatbot (Gemini)</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto space-y-4" ref={chatContainerRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              Start a conversation or upload an image to begin!
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {typeof m.content === "string" ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div>
                    <div className="mb-2">{m.content.text}</div>
                    {m.content.image_url && (
                      <Image
                        src={m.content.image_url || "/placeholder.svg"}
                        alt="Uploaded image"
                        width={200}
                        height={200}
                        className="rounded-md"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">Thinking...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-destructive p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <ImageUpload onImageUpload={setImageUrl} fileInputRef={fileInputRef} />
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={imageUrl ? "Ask about the image..." : "Type your message..."}
              className="flex-grow"
            />
            <Button type="submit" disabled={isTyping}>
              {isTyping ? "Sending..." : "Send"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

