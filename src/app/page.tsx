import { Suspense } from "react"
import standardsData from "@/data/standards.json"
import { GraphPage } from "@/components/graph/graph-page"
import type { StandardsGraph } from "@/lib/graph-types"

export default function Home() {
  return (
    <Suspense>
      <GraphPage data={standardsData as StandardsGraph} />
    </Suspense>
  )
}
