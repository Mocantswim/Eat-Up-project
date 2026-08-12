import React, { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';

// 8 张欢迎页封面（随机挑 1 张）
const COVERS = [
  require('../../assets/covers/cover1.png'),
  require('../../assets/covers/cover2.png'),
  require('../../assets/covers/cover3.png'),
  require('../../assets/covers/cover4.png'),
  require('../../assets/covers/cover5.png'),
  require('../../assets/covers/cover6.png'),
  require('../../assets/covers/cover7.png'),
  require('../../assets/covers/cover8.png'),
];

/** JS 欢迎页：每次随机显示 1 张封面，约 1.8 秒后进入主界面（可 OTA 更新） */
export default function CoverScreen({ onDone }: { onDone: () => void }) {
  // 随机选一张（仅在挂载时决定，避免重新渲染换图）
  const [index] = useState(() => Math.floor(Math.random() * COVERS.length));

  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return <Image source={COVERS[index]} style={styles.image} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
