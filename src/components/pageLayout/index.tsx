import React, { ReactNode } from 'react';
import PageLayoutWithTabs from './PageLayoutWithTabs';
import HelpLink from './HelpLink';

export { HelpLink };

interface PageLayoutProps {
  icon?: ReactNode;
  title?: string | JSX.Element;
  children?: ReactNode;
  introIcon?: ReactNode;
  rightArea?: ReactNode;
  customArea?: ReactNode;
  showBack?: boolean;
  backPath?: string;
  doc?: string;
  docFn?: Function;
}

const PageLayout: React.FC<PageLayoutProps> = (props) => {
  return <PageLayoutWithTabs {...props as any} />;
};

export default PageLayout;
