import fs from "node:fs";
import { runAgent } from "../lib/agent";

async function main() {
  fs.mkdirSync("data/library", { recursive: true });
  for (const app of process.argv.slice(2)) {
    console.log("Investigating", app);
    const guide = await runAgent(app, (s) => console.log("  ", s));
    const id = app.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    fs.writeFileSync(`data/library/${id}.json`, JSON.stringify(guide, null, 2));
    console.log("Saved data/library/" + id + ".json  (review it before committing)");
  }
}
main();
