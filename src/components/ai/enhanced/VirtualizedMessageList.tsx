import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import type { AIMessage } from '@/lib/stores/useAIChatStore';

interface VirtualizedMessageListProps {
  messages: AIMessage[];
  renderRow: (msg: AIMessage) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  loadingMore?: boolean;
  followOutput?: boolean;
}

/**
 * A virtualization wrapper around react-window that supports dynamic row heights.
 * It measures each row on initial render and stores the heights so we can provide
 * them back to react-window via getItemSize.
 */
const ROW_GAP = 16; // gap (px) between bubbles – must match CSS margin-bottom

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  renderRow,
  onLoadMore,
  loadingMore = false,
  followOutput = true,
}) => {
  // Heights cache, keyed by row index
  const sizeMap = useRef<Record<number, number>>({});
  const listRef = useRef<any>(null);
  const prevCountRef = useRef(messages.length);

  const getItemSize = useCallback(
    (index: number) => {
      return sizeMap.current[index] ?? 80; // Fallback height
    },
    []
  );

  const setSize = useCallback((index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current = { ...sizeMap.current, [index]: size };
      // Defer resetAfterIndex so we don't trigger nested updates synchronously
      window.requestAnimationFrame(() => {
        listRef.current?.resetAfterIndex(index);
      });
    }
  }, []);

  // Wrapper row renderer that measures actual DOM height
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const setRowRef = (node: HTMLDivElement | null) => {
        if (node) {
          const newHeight = node.getBoundingClientRect().height + ROW_GAP; // Height inc. margin
          setSize(index, newHeight);
        }
      };

      const msg = messages[index];
      return (
        <div style={style}>
          <div ref={setRowRef} style={{ paddingBottom: ROW_GAP / 2 }}>
            {renderRow(msg)}
          </div>
        </div>
      );
    },
    [messages, renderRow]
  );

  // Handle infinite scroll (load older messages)
  const handleScroll = useCallback(
    async ({ scrollOffset }: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
      if (scrollOffset === 0 && onLoadMore && !loadingMore) {
        await onLoadMore();
        // After loading more messages we'll keep the current view stable by
        // scrolling to roughly the height of newly loaded items.
        listRef.current?.scrollTo(1); // small offset to prevent refiring
      }
    },
    [onLoadMore, loadingMore]
  );

  // React-window requires a stable item count memo
  const itemCount = useMemo(() => messages.length, [messages.length]);

  // Auto-follow new output
  useEffect(() => {
    if (followOutput && messages.length > prevCountRef.current) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
    prevCountRef.current = messages.length;
  }, [messages.length, followOutput]);

  return (
    <AutoSizer>
      {({ height, width }: { height: number; width: number }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          itemCount={itemCount}
          itemSize={getItemSize}
          overscanCount={8}
          onScroll={handleScroll as any}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export default VirtualizedMessageList; 