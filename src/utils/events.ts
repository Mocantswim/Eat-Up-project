/** 轻量事件总线：数据清除后通知 App 重置到引导页 */
type Handler = () => void;
const handlers = new Set<Handler>();

export function onDataCleared(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function emitDataCleared(): void {
  handlers.forEach((h) => h());
}
