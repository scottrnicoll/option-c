"use client"

import type { StandardNode } from "@/lib/graph-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConceptCardProps {
  standard: StandardNode
  onReady: () => void
}

export function ConceptCard({ standard, onReady }: ConceptCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="secondary" className="w-fit text-xs">
        {standard.domain}
      </Badge>

      <Card>
        <CardHeader>
          <CardTitle>What is this?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This standard is about {standard.description.charAt(0).toLowerCase() + standard.description.slice(1)}. Content coming soon — for now, think about what this means in the real world.
          </p>
        </CardContent>
      </Card>

      <Button onClick={onReady} size="lg" className="w-full">
        Next →
      </Button>
    </div>
  )
}
