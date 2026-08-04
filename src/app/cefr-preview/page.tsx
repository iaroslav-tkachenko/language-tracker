import { notFound } from "next/navigation";

import { CefrPreview } from "@/components/cefr/cefr-preview";

export default function CefrPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return <CefrPreview />;
}
