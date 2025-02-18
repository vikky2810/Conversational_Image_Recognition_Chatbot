import type React from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function ImageUpload({ onImageUpload, fileInputRef }: ImageUploadProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onImageUpload(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
      <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
        <ImagePlus className="h-4 w-4" />
      </Button>
    </>
  )
}

