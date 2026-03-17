import React, { useContext } from 'react';

import { cn } from '@/components/menu/SideMenu/utils';
import { CommonStateContext } from '@/App';

import { DefaultLogos } from './types';

interface Props {
  collapsed: boolean;
  collapsedHover: boolean;
  sideMenuBgMode: string;
  defaultLogos: DefaultLogos;
}

const LEGACY_BIG_LOGO = '/image/logo-l.png';
const LEGACY_SMALL_LOGO = '/image/logo.png';

const getLogoSrc = (collapsed: boolean, sideMenuBgMode: string, defaultLogos: DefaultLogos, siteInfo?: any) => {
  if (!collapsed) {
    if (sideMenuBgMode === 'light') {
      return siteInfo?.light_menu_big_logo_url || defaultLogos.light_menu_big_logo_url || '/image/logo-light-l.png';
    }
    return siteInfo?.menu_big_logo_url || defaultLogos.menu_big_logo_url;
  }
  if (sideMenuBgMode === 'light') {
    return siteInfo?.light_menu_small_logo_url || defaultLogos.light_menu_small_logo_url || '/image/logo-light.png';
  }
  return siteInfo?.menu_small_logo_url || defaultLogos.menu_small_logo_url;
};

export default function SideMenuHeader(props: Props) {
  const { collapsed, collapsedHover, sideMenuBgMode, defaultLogos } = props;
  const { siteInfo } = useContext(CommonStateContext);

  const noCollapsedLogo = getLogoSrc(false, sideMenuBgMode, defaultLogos, siteInfo);
  const collapsedLogo = getLogoSrc(true, sideMenuBgMode, defaultLogos, siteInfo);
  const showBigTextLogo = !noCollapsedLogo || noCollapsedLogo === LEGACY_BIG_LOGO;
  const showSmallTextLogo = !collapsedLogo || collapsedLogo === LEGACY_SMALL_LOGO;

  return (
    <div className={cn('relative mt-6 h-10 w-full shrink-0 overflow-hidden transition-spacing', 'flex justify-center')}>
      {showBigTextLogo ? (
        <div
          className='h-[38px] max-w-[120px] text-[28px] font-semibold leading-[38px] tracking-[0.08em]'
          style={{
            display: !collapsed || collapsedHover ? 'block' : 'none',
          }}
        >
          AIDO
        </div>
      ) : (
        <img
          src={noCollapsedLogo}
          width={120}
          height={38}
          className='max-w-[120px]'
          style={{
            display: !collapsed || collapsedHover ? 'block' : 'none',
          }}
        />
      )}
      {showSmallTextLogo ? (
        <div
          className='h-[38px] w-[36px] text-center text-[20px] font-semibold leading-[38px]'
          style={{
            display: !collapsed || collapsedHover ? 'none' : 'block',
          }}
        >
          A
        </div>
      ) : (
        <img
          src={collapsedLogo}
          width={36}
          height={38}
          className='max-w-[120px]'
          style={{
            display: !collapsed || collapsedHover ? 'none' : 'block',
          }}
        />
      )}
    </div>
  );
}
