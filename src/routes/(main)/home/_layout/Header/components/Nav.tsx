'use client';

import { ActionIcon, Flexbox, Tag } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { type NavItemProps } from '@/features/NavPanel/components/NavItem';
import NavItem from '@/features/NavPanel/components/NavItem';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { type NavItem as NavItemType, useNavLayout } from '@/hooks/useNavLayout';
import { isModifierClick } from '@/utils/navigation';
import { prefetchRoute } from '@/utils/router';

/**
 * Keys rendered as full-width nav items at the top of the header. Order matters.
 * All other nav items are managed by Body via sidebarItems, except those in ICON_KEYS
 * which are rendered as compact icons at the bottom of the header.
 */
const PRIMARY_KEYS: string[] = ['home', 'search', 'newChat', 'pages', 'project'];

/** Keys rendered as compact icon-only buttons in the header (deprioritized). */
const ICON_KEYS: string[] = [];

/** Union of all keys handled by the header — used by Body to skip them. */
export const HEADER_NAV_KEYS = new Set<string>([...PRIMARY_KEYS, ...ICON_KEYS]);

const Nav = memo(() => {
  const tab = useActiveTabKey();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { topNavItems } = useNavLayout();

  const itemMap = new Map<string, NavItemType>();
  for (const item of topNavItems) itemMap.set(item.key, item);

  const newBadge = (
    <Tag color="blue" size="small">
      {t('new')}
    </Tag>
  );

  const handleNavigate = (item: NavItemType) => (e: React.MouseEvent) => {
    if (isModifierClick(e)) return;
    e.preventDefault();
    item?.onClick?.();
    if (item.url) navigate(item.url);
  };

  const renderPrimary = (item: NavItemType) => {
    const extra = item.isNew ? newBadge : undefined;
    const navItem = (
      <NavItem
        primary
        active={tab === item.key}
        extra={extra}
        hidden={item.hidden}
        icon={item.icon as NavItemProps['icon']}
        title={item.title}
        onClick={item.onClick}
      />
    );
    if (!item.url) return <div key={item.key}>{navItem}</div>;
    return (
      <Link
        key={item.key}
        to={item.url}
        onClick={handleNavigate(item)}
        onMouseEnter={() => prefetchRoute(item.url!)}
      >
        {navItem}
      </Link>
    );
  };

  const renderIcon = (item: NavItemType) => {
    const icon = (
      <ActionIcon
        icon={item.icon}
        size={'small'}
        title={item.title}
        tooltipProps={{ placement: 'bottom' }}
        onClick={item.onClick}
      />
    );
    if (!item.url) return <div key={item.key}>{icon}</div>;
    return (
      <Link
        key={item.key}
        to={item.url}
        onClick={handleNavigate(item)}
        onMouseEnter={() => prefetchRoute(item.url!)}
      >
        {icon}
      </Link>
    );
  };

  return (
    <Flexbox gap={4} paddingInline={4}>
      <Flexbox horizontal align={'center'} gap={4} paddingInline={4}>
        {ICON_KEYS.map((key) => {
          const item = itemMap.get(key);
          if (!item || item.hidden) return null;
          return renderIcon(item);
        })}
      </Flexbox>
      {PRIMARY_KEYS.map((key) => {
        const item = itemMap.get(key);
        if (!item || item.hidden) return null;
        return renderPrimary(item);
      })}
    </Flexbox>
  );
});

export default Nav;
