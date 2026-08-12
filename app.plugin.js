/**
 * 自定义 Expo config plugin —— 卸载彻底性兜底方案。
 *
 * 在 AndroidManifest.xml 强制注入 android:allowBackup="false"：
 * 关闭 Android Auto Backup / 设备迁移备份，确保卸载后数据不残留、重装不自动恢复。
 * 该方案为确定性注入，不依赖 expo-build-properties 的 allowBackup 版本支持。
 */
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withDisableBackup(config) {
  return withAndroidManifest(config, (configProps) => {
    const manifest = configProps.modResults;
    const application = manifest.manifest?.application?.[0];
    if (application) {
      application.$['android:allowBackup'] = 'false';
    }
    return configProps;
  });
};
