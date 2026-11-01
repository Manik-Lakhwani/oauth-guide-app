import { notFound } from "next/navigation";
import GuideView from "../../../components/GuideView";
import { getLibraryGuide } from "../../../lib/library";
import { loadGuide } from "../../../lib/store";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]+$/.test(id)) notFound();
  const lib = getLibraryGuide(id);
  const g = lib || (await loadGuide(id));
  if (!g) notFound();
  return <main><a href="/">All guides</a>{!lib && <p className="notice">Generated live by the agent and not manually reviewed. Check the evidence tags before relying on it.</p>}<GuideView g={g} /></main>;
}
