import React from "react";

export const BetaAbout: React.FC = () => {
  const [info, setInfo] = React.useState<any>(null);
  React.useEffect(() => {
    fetch(chrome.runtime.getURL("version.json"))
      .then(r => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);
  if (!info) return null;
  return (
    <div style={{ fontSize: 12, opacity: 0.75 }}>
      Beta {info.version} · {info.commit} · {new Date(info.build_time).toLocaleString()}
    </div>
  );
};
