import React from 'react';

interface Props {
  collapsed: boolean;
}

export default function SideMenuHeader({ collapsed }: Props) {
  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0 8px',
        fontWeight: 700,
        fontSize: collapsed ? 20 : 22,
        letterSpacing: '0.06em',
        color: 'var(--fc-text-1)',
        userSelect: 'none',
      }}
    >
      {collapsed ? (
        <span
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            background: 'var(--fc-primary-color)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          A
        </span>
      ) : (
        <span>AIDO</span>
      )}
    </div>
  );
}
