// src/screens/FriendsScreen.tsx
import { useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import RowItem from '../components/RowItem';
import DetailModal from '../components/DetailModal';

type FriendRow = { id: string; name: string; status?: string; about?: string };

export default function FriendsScreen() {
  const t = useTheme();

  const friends: FriendRow[] = useMemo(
    () => [
      { id: 'u1', name: 'Alana Kim',   status: 'Free 10–12 AM',   about: 'Prefers weekday mornings.' },
      { id: 'u2', name: 'Justin Lee',  status: 'Evenings after 6', about: 'Free most weekends.' },
      { id: 'u3', name: 'Tyler R.',  status: 'Thu/Fri afternoons', about: 'Gym on Tue/Sat.' },
      { id: 'u4', name: 'Bryan',      status: 'Varies',           about: 'DM for availability.' },
    ],
    []
  );

  const [selected, setSelected] = useState<FriendRow | null>(null);

  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '700', marginBottom: t.space.md }}>
        Friends
      </Text>

      <FlatList
        data={friends}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <RowItem
            title={item.name}
            subtitle={item.status}
            onPress={() => setSelected(item)}
            testID={`friend-${item.id}`}
          />
        )}
      />

      <DetailModal
        visible={!!selected}
        title={selected?.name ?? ''}
        body={selected?.about}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}
