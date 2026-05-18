import { useEffect, useRef } from 'react';
import { trackScreenView } from '../api/analytics';

const TAB_PATHS = {
  home: 'mobile:/home',
  quran: 'mobile:/quran',
  hadith: 'mobile:/hadith',
  ibadah: 'mobile:/ibadah',
  belajar: 'mobile:/belajar',
  profile: 'mobile:/profile',
};

const AnalyticsTracker = ({ activeTab, internalRoutes }) => {
  const prevPathRef = useRef(null);

  useEffect(() => {
    const currentView = internalRoutes?.[activeTab] ?? null;
    const path = currentView
      ? `mobile:/${activeTab}/${currentView.view}`
      : TAB_PATHS[activeTab] ?? `mobile:/${activeTab}`;

    if (path === prevPathRef.current) return;

    const referrer = prevPathRef.current ?? '';
    trackScreenView({ path, referrer });
    prevPathRef.current = path;
  }, [activeTab, internalRoutes]);

  return null;
};

export default AnalyticsTracker;
