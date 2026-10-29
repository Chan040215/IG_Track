import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="ig-toast">
      <Sparkles size={14} />
      <span>{message}</span>
    </div>
  );
}
