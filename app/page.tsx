"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { AlertCircle, X } from "lucide-react"

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancelImage = () => {
    setImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setError(null)
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
      setMessages((prev) => [...prev, newMessage])
      setInput("")
      setImageUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMessage] }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to get response from API")
      if (data.error) throw new Error(data.error)

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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Image Recognition Chatbot</CardTitle>
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
                      <div className="flex justify-center">
                        <Image
                          src={m.content.image_url}
                          alt="Uploaded image"
                          width={200}
                          height={200}
                          className="rounded-md"
                        />
                      </div>
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
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            {!imageUrl && (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Upload Image
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="relative flex-grow">
              {imageUrl && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Image
                    src={imageUrl}
                    alt="Image preview"
                    width={40}
                    height={40}
                    className="rounded-md border"
                  />
                  <Button
                    type="button"
                    onClick={handleCancelImage}
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={imageUrl ? "Ask about the image..." : "Type your message..."}
                className={imageUrl ? "pl-[120px]" : "pl-12"} // Adjusted padding to account for image and cancel icon
              />
            </div>

            <Button type="submit" disabled={isTyping}>
              {isTyping ? "Sending..." : "Send"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}