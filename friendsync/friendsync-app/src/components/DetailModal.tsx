import { Modal, View, Text, Pressable } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  onClose: () => void;
};

export default function DetailModal({ visible, title, body, onClose }: Props) {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: t.space.lg,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 520,
            backgroundColor: t.color.surface,
            borderRadius: t.radius.lg,
            padding: t.space.lg,
            borderWidth: 1,
            borderColor: t.color.border,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{title}</Text>
          {!!body && <Text style={{ color: t.color.text, marginTop: t.space.sm }}>{body}</Text>}

          <View style={{ marginTop: t.space.lg, alignItems: 'flex-end' }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close details"
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: t.radius.md,
                backgroundColor: pressed ? t.color.surfaceAlt : t.color.surface,
                borderWidth: 1,
                borderColor: t.color.border,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
