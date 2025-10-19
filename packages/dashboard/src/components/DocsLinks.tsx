import React from 'react';

export function DocsLinks() {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3>Documentation</h3>
      <ul>
        <li><a href="/PRIVACY.md" target="_blank" rel="noreferrer">Privacy Policy</a></li>
        <li><a href="/SECURITY.md" target="_blank" rel="noreferrer">Security Overview</a></li>
        <li><a href="/SAFEGUARDS.md" target="_blank" rel="noreferrer">Safeguards</a></li>
      </ul>
    </div>
  );
}
