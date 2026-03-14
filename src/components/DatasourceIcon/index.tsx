import React, { useMemo, useState } from 'react';
import { Avatar } from 'antd';

interface Props {
  logo?: string;
  label?: string;
  ident?: string;
  size?: number;
}

const COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#2f54eb', '#d4380d'];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickColor(seed: string): string {
  const idx = hashString(seed) % COLORS.length;
  return COLORS[idx];
}

function getInitials(label?: string, ident?: string): string {
  const source = (label || ident || '?').trim();
  if (!source) return '?';

  // Prefer initials from words; fallback to first 2 chars of ident.
  const words = source.split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function DatasourceIcon({ logo, label, ident, size = 16 }: Props) {
  const [imgError, setImgError] = useState(false);
  const seed = `${ident || ''}|${label || ''}`;
  const fallback = useMemo(
    () => (
      <Avatar size={size} shape='square' style={{ backgroundColor: pickColor(seed), fontSize: Math.max(10, Math.floor(size * 0.55)), lineHeight: `${size}px` }}>
        {getInitials(label, ident)}
      </Avatar>
    ),
    [seed, size, label, ident],
  );

  if (!logo || imgError) {
    return fallback;
  }

  return (
    <img
      src={logo}
      alt={label || ident || 'datasource'}
      height={size}
      width={size}
      style={{ objectFit: 'contain' }}
      onError={() => setImgError(true)}
    />
  );
}
