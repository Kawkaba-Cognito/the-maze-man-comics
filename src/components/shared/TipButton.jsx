import React from 'react';
import { useApp } from '../../context/AppContext';

export default function TipButton() {
  const { openTip } = useApp();
  return (
    <button id="tip-btn" onClick={openTip} title="Support the creator!">☕</button>
  );
}
