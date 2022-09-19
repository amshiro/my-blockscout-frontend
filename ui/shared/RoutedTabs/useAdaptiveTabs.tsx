import _debounce from 'lodash/debounce';
import React from 'react';

import type { RoutedTab } from './types';

import { menuButton } from './utils';

export default function useAdaptiveTabs(tabs: Array<RoutedTab>) {
  const [ tabsCut, setTabsCut ] = React.useState(tabs.length);
  const [ tabsRefs, setTabsRefs ] = React.useState<Array<React.RefObject<HTMLButtonElement>>>([]);
  const listRef = React.useRef<HTMLDivElement>(null);

  const calculateCut = React.useCallback(() => {
    const listWidth = listRef.current?.getBoundingClientRect().width;
    const tabWidths = tabsRefs.map((tab) => tab.current?.getBoundingClientRect().width);
    const menuWidth = tabWidths.at(-1);

    if (!listWidth || !menuWidth) {
      return tabs.length;
    }

    const { visibleNum } = tabWidths.slice(0, -1).reduce((result, item, index) => {
      if (!item) {
        return result;
      }

      if (result.accWidth + item <= listWidth - menuWidth) {
        return { visibleNum: result.visibleNum + 1, accWidth: result.accWidth + item };
      }

      if (result.accWidth + item <= listWidth && index === tabWidths.length - 2) {
        return { visibleNum: result.visibleNum + 1, accWidth: result.accWidth + item };
      }

      return result;
    }, { visibleNum: 0, accWidth: 0 });

    return visibleNum;
  }, [ tabs.length, tabsRefs ]);

  const tabsWithMenu = React.useMemo(() => {
    return [ ...tabs, menuButton ];
  }, [ tabs ]);

  React.useEffect(() => {
    setTabsRefs(tabsWithMenu.map((_, index) => tabsRefs[index] || React.createRef()));
  // imitate componentDidMount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (tabsRefs.length > 0) {
      setTabsCut(calculateCut());
    }
  }, [ calculateCut, tabsRefs ]);

  React.useEffect(() => {
    const resizeHandler = _debounce(() => {
      setTabsCut(calculateCut());
    }, 100);
    const resizeObserver = new ResizeObserver(resizeHandler);

    resizeObserver.observe(document.body);
    return function cleanup() {
      resizeObserver.unobserve(document.body);
    };
  }, [ calculateCut ]);

  return React.useMemo(() => {
    return {
      tabsCut,
      tabsWithMenu,
      tabsRefs,
      listRef,
    };
  }, [ tabsWithMenu, tabsCut, tabsRefs, listRef ]);
}
