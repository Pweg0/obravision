"use client"

import dynamic from "next/dynamic"

export const PlantaViewerClient = dynamic(
  () => import("./PlantaViewerClient").then((m) => m.PlantaViewerClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Carregando visualizador...
      </div>
    ),
  }
)
