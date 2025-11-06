import { Pressable, View, Text } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
};

export default function SquareItem({ title, subtitle, onPress, testID }: Props) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? ', ' + subtitle : ''}`}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48%',                // 2 per row
        aspectRatio: 1,              // square
        backgroundColor: t.color.surface,
        borderRadius: t.radius.md,
        padding: t.space.md,
        justifyContent: 'space-between',
        marginBottom: t.space.md,
        opacity: pressed ? 0.9 : 1,
        borderWidth: 1,
        borderColor: t.color.border,
        // soft shadow (subtle on web)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
      })}
    >
      <View>
        <Text style={{ color: '#fff', fontWeight: '700' }} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ color: t.color.textMuted, marginTop: 4 }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={{ color: t.color.accent, fontSize: t.font.label }}>Tap for details</Text>
    </Pressable>
  );
}
