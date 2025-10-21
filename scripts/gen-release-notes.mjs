import fs from "node:fs";
const template = fs.existsSync("docs/RELEASE_NOTES_TEMPLATE.md")
  ? fs.readFileSync("docs/RELEASE_NOTES_TEMPLATE.md", "utf8")
  : "# Release {{version}}\n\n- …\n";
const version = JSON.parse(fs.readFileSync("version.json", "utf8"));
const map = {
  version: version.version,
  commit: version.commit,
  build_time: version.build_time,
  sha_dashboard: process.env.SHA_DASHBOARD ?? "",
  sha_extension: process.env.SHA_EXTENSION ?? ""
};
const output = template.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] ?? "");
fs.writeFileSync("RELEASE_NOTES.md", output);
console.log("📝 Release notes generated for", version.version);
