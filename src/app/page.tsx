import standardsData from "@/data/standards.json"
import { GraphPage } from "@/components/graph/graph-page"
import type { StandardsGraph } from "@/lib/graph-types"

export default function Home() {
  return <GraphPage data={standardsData as StandardsGraph} />
}
