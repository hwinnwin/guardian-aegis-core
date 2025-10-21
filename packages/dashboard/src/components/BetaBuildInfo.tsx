import React from "react";

type Info = { version: string; commit: string; build_time: string };
type Flags = Record<string, boolean>;

export function BetaBuildInfo() {
  const [info, setInfo] = React.useState<Info | null>(null);
  const [flags, setFlags] = React.useState<Flags | null>(null);

  React.useEffect(() => {
    fetch("/version.json").then(r => r.json()).then(setInfo).catch(() => {});
    fetch("/feature-flags.json").then(r => r.json()).then(setFlags).catch(() => {});
  }, []);

  if (!info) return null;
  return (
    <div className="text-xs text-muted-foreground mt-4">
      <span>Beta {info.version}</span>
      {" · "}
      <span>commit {info.commit}</span>
      {flags ? <> {" · " }flags {Object.keys(flags).length}</> : null}
    </div>
  );
}
