"use client"

import { useRef, useState } from "react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { initializeApp, getApps } from "firebase/app"
import {
  SPRITE_CHARACTERS,
  SPRITE_ITEMS,
  SPRITE_BACKGROUNDS,
  resolveSpriteUrl,
} from "@/lib/sprite-library"

// Ensure Firebase app is initialized (reuse existing)
function getFirebaseStorage() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return getStorage(app)
}

interface ArtworkPickerProps {
  onSelect: (sprites: {
    characterSprite: string
    itemSprite: string
    backgroundImage: string
  }) => void
  onSkip: () => void
}

export function ArtworkPicker({ onSelect, onSkip }: ArtworkPickerProps) {
  const [selectedChar, setSelectedChar] = useState<string>(SPRITE_CHARACTERS[0].id)
  const [selectedItem, setSelectedItem] = useState<string>(SPRITE_ITEMS[0].id)
  const [selectedBg, setSelectedBg] = useState<string>(SPRITE_BACKGROUNDS[0].id)
  const [uploading, setUploading] = useState<"character" | "item" | "background" | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const charFileRef = useRef<HTMLInputElement>(null)
  const itemFileRef = useRef<HTMLInputElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (
    file: File,
    type: "character" | "item" | "background",
    setter: (url: string) => void
  ) => {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large — max 2MB")
      return
    }
    setUploading(type)
    setUploadError(null)
    try {
      const storage = getFirebaseStorage()
      const storageRef = ref(storage, `sprites/uploads/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setter(url)
    } catch {
      setUploadError("Upload failed — please try again")
    } finally {
      setUploading(null)
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "character" | "item" | "background",
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file, type, setter)
    e.target.value = ""
  }

  const handleUseThese = () => {
    onSelect({
      characterSprite: selectedChar,
      itemSprite: selectedItem,
      backgroundImage: selectedBg,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">Pick your artwork</h3>
        <p className="text-sm text-zinc-400 mt-0.5">Choose sprites for your game, or skip to use defaults</p>
      </div>

      {/* Character row */}
      <SpriteRow
        label="Character"
        icon="🧑"
        sprites={SPRITE_CHARACTERS.map((s) => ({
          id: s.id,
          label: s.label,
          url: resolveSpriteUrl("characters", s.id),
        }))}
        selected={selectedChar}
        onSelect={setSelectedChar}
        thumbSize="char"
        uploading={uploading === "character"}
        onUploadClick={() => charFileRef.current?.click()}
      />
      <input
        ref={charFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e, "character", setSelectedChar)}
      />

      {/* Items row */}
      <SpriteRow
        label="Items"
        icon="💎"
        sprites={SPRITE_ITEMS.map((s) => ({
          id: s.id,
          label: s.label,
          url: resolveSpriteUrl("items", s.id),
        }))}
        selected={selectedItem}
        onSelect={setSelectedItem}
        thumbSize="char"
        uploading={uploading === "item"}
        onUploadClick={() => itemFileRef.current?.click()}
      />
      <input
        ref={itemFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e, "item", setSelectedItem)}
      />

      {/* Background row */}
      <SpriteRow
        label="Background"
        icon="🌄"
        sprites={SPRITE_BACKGROUNDS.map((s) => ({
          id: s.id,
          label: s.label,
          url: resolveSpriteUrl("backgrounds", s.id),
        }))}
        selected={selectedBg}
        onSelect={setSelectedBg}
        thumbSize="bg"
        uploading={uploading === "background"}
        onUploadClick={() => bgFileRef.current?.click()}
      />
      <input
        ref={bgFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e, "background", setSelectedBg)}
      />

      {uploadError && (
        <p className="text-xs text-red-400 text-center">{uploadError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={handleUseThese}
          disabled={uploading !== null}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          Use these →
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-1"
        >
          Skip — use defaults
        </button>
      </div>
    </div>
  )
}

interface SpriteEntry {
  id: string
  label: string
  url: string
}

function SpriteRow({
  label,
  icon,
  sprites,
  selected,
  onSelect,
  thumbSize,
  uploading,
  onUploadClick,
}: {
  label: string
  icon: string
  sprites: SpriteEntry[]
  selected: string
  onSelect: (id: string) => void
  thumbSize: "char" | "bg"
  uploading: boolean
  onUploadClick: () => void
}) {
  const thumbW = thumbSize === "bg" ? 120 : 64
  const thumbH = thumbSize === "bg" ? 60 : 64

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {sprites.map((sprite) => {
          const isSelected = selected === sprite.id || selected === sprite.url
          return (
            <button
              key={sprite.id}
              onClick={() => onSelect(sprite.id)}
              title={sprite.label}
              className={`shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                isSelected
                  ? "border-emerald-400 ring-2 ring-emerald-500/30"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
              style={{ width: thumbW, height: thumbH }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sprite.url}
                alt={sprite.label}
                width={thumbW}
                height={thumbH}
                className="w-full h-full object-contain bg-zinc-900"
              />
            </button>
          )
        })}

        {/* Upload button */}
        <button
          onClick={onUploadClick}
          disabled={uploading}
          title="Upload your own"
          className="shrink-0 rounded-lg border-2 border-dashed border-zinc-600 hover:border-zinc-400 bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all disabled:opacity-40"
          style={{ width: thumbW, height: thumbH, minWidth: thumbW }}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-lg leading-none">+</span>
              <span className="text-[9px] uppercase tracking-wide font-semibold">Upload</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
