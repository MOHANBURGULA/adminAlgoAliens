import { TheoryViewer } from "@/components/theory/TheoryViewer"

type TheoryPageProps = {
  params: Promise<{ moduleId: string }>
}

export default async function TheoryPage({ params }: TheoryPageProps) {
  const { moduleId } = await params
  return <TheoryViewer moduleId={Number(moduleId)} />
}
