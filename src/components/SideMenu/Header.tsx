import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  collapsed: boolean;
}

export default function SideMenuHeader({ collapsed }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/home')}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/home'); }}
      role='button'
      tabIndex={0}
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
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      title='Go to Home'
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
