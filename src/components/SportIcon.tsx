import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/theme';

interface Props {
  emoji: string;
  size?: number;
  bg?: string;
}

/** 运动图标：扁平可爱圆底 + emoji（零资源成本） */
export default function SportIcon({ emoji, size = 44, bg = colors.primaryBg }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
