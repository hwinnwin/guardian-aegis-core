import React from "react";

type BuildInfo = {
  version?: string;
  commit?: string;
  build_time?: number | string;
};

export const BetaAbout: React.FC = () => {
  const [info, setInfo] = React.useState<BuildInfo | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(chrome.runtime.getURL("version.json"));
        const payload = (await response.json()) as BuildInfo;
        if (!cancelled) {
          setInfo(payload);
        }
      } catch {
        if (!cancelled) {
          setInfo(null);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;
  const buildTime =
    typeof info.build_time === "number" || typeof info.build_time === "string"
      ? new Date(info.build_time).toLocaleString()
      : "unknown";

  return (
    <div style={{ fontSize: 12, opacity: 0.75 }}>
      Beta {info.version ?? "unknown"} · {info.commit ?? "?"} · {buildTime}
    </div>
  );
};
