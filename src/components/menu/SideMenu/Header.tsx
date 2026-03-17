import React, { useContext } from 'react';
import { cn } from '@/components/menu/SideMenu/utils';
import { CommonStateContext } from '@/App';

interface Props {
  collapsed: boolean;
  collapsedHover: boolean;
  sideMenuBgMode: string;
}

const LEGACY_BIG_LOGO = '/image/logo-l.png';
const LEGACY_SMALL_LOGO = '/image/logo.png';

const getLogoSrc = (collapsed: boolean, sideMenuBgMode: string, siteInfo?: any) => {
  if (!collapsed) {
    if (sideMenuBgMode === 'light') {
      return siteInfo?.light_menu_big_logo_url || '/image/logo-light-l.png';
    }
    return siteInfo?.menu_big_logo_url;
  }
  if (sideMenuBgMode === 'light') {
    return siteInfo?.light_menu_small_logo_url || '/image/logo-light.png';
  }
  return siteInfo?.menu_small_logo_url;
};

export default function SideMenuHeader(props: Props) {
  const { collapsed, collapsedHover, sideMenuBgMode } = props;
  const { siteInfo } = useContext(CommonStateContext);

  const noCollapsedLogo = getLogoSrc(false, sideMenuBgMode, siteInfo);
  const collapsedLogo = getLogoSrc(true, sideMenuBgMode, siteInfo);
  const showBigTextLogo = !noCollapsedLogo || noCollapsedLogo === LEGACY_BIG_LOGO;
  const showSmallTextLogo = !collapsedLogo || collapsedLogo === LEGACY_SMALL_LOGO;

  return (
    <div className={cn('relative mt-6 h-10 w-full shrink-0 overflow-hidden transition-spacing', 'pl-3.5')}>
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
