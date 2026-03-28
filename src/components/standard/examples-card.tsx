"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ExamplesCardProps {
  standardDescription: string
  onReady: () => void
}

const PLACEHOLDER_EXAMPLES = [
  "In strategy games, players use this concept to optimize their decisions",
  "In building games, this math determines the best approach to a challenge",
  "In puzzle games, understanding this concept is the key to winning",
]

export function ExamplesCard({ standardDescription, onReady }: ExamplesCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Real-World Examples</h3>
      <p className="text-sm text-muted-foreground">
        Here are some ways <span className="font-medium text-foreground">{standardDescription}</span> shows up in the real world.
      </p>

      <div className="flex flex-col gap-3">
        {PLACEHOLDER_EXAMPLES.map((example, i) => (
          <Card key={i} size="sm">
            <CardContent>
              <p className="text-sm">{example}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onReady} size="lg" className="w-full">
        I have a game idea →
      </Button>
    </div>
  )
}
