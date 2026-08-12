import * as Updates from 'expo-updates';

/**
 * 启动时后台检查并应用 OTA 更新。
 * 若服务器有新版本，自动下载 → 重载应用（下次进入即是新版本）。
 * 开发模式 / 无网络 / 非发布构建时静默跳过。
 */
export async function autoCheckUpdate(): Promise<void> {
  if (__DEV__) return;
  try {
    const res = await Updates.checkForUpdateAsync();
    if (res.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // 静默忽略
  }
}

/** 手动检查更新（我的页按钮）。返回结果供 UI 提示。 */
export async function manualCheckUpdate(): Promise<'latest' | 'error' | 'updated'> {
  if (__DEV__) return 'error';
  try {
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return 'latest';
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'updated';
  } catch {
    return 'error';
  }
}
