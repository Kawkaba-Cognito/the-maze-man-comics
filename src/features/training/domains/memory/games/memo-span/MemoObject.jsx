import React from 'react';
import { getMemoObject, objectLabel } from './memoObjects';

export default function MemoObject({ objectId, isAr, size = 'lg', showName = false }) {
  const obj = getMemoObject(objectId);
  const name = objectLabel(objectId, isAr);
  return (
    <div className={`ct-ms-object ct-ms-object--${size}`}>
      <span className="ct-ms-object-emoji" aria-hidden="true">
        {obj.emoji}
      </span>
      {showName && <span className="ct-ms-object-name">{name}</span>}
    </div>
  );
}

export function MemoObjectRow({ objectIds: ids, isAr, size = 'sm' }) {
  return (
    <div className="ct-ms-object-row" aria-hidden="true">
      {ids.map((id) => (
        <MemoObject key={id} objectId={id} isAr={isAr} size={size} />
      ))}
    </div>
  );
}
