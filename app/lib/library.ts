import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data", "library");

export function listLibrary(): any[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(".json", ""), ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

export function getLibraryGuide(id: string) {
  const f = path.join(dir, `${id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}
