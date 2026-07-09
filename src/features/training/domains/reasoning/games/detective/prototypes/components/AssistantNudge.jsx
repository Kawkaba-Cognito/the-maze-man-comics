import React from 'react';

export default function AssistantNudge({ assistant, message, isAr }) {
  if (!message) return null;
  const name = assistant ? (isAr ? assistant.name?.ar : assistant.name?.en) : null;
  return (
    <div style={{
      margin: '0 10px 6px', padding: '8px 12px', borderRadius: 12,
      background: '#fff1d8', border: '1.5px solid #e3c489',
      display: 'flex', gap: 8, alignItems: 'flex-start', animation: 'dt-slide 0.3s ease-out',
    }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{assistant?.e || '👧'}</span>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#5a4a32', lineHeight: 1.45, flex: 1 }}>
        {name && <strong>{name}: </strong>}{message}
      </p>
    </div>
  );
}
