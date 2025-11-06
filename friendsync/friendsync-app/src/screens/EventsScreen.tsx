// src/screens/EventsScreen.tsx
// import { Text } from 'react-native';
// import Screen from '../components/ScreenTmp';
// import { useTheme } from '../lib/ThemeProvider';

// export default function EventsScreen() {
//   const t = useTheme();
//   return (
//     <Screen>
//       <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '600' }}>
//         Events (placeholder)
//       </Text>
//       <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
//         Event list & details coming soon.
//       </Text>
//     </Screen>
//   );
// }

import { useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import SquareItem from '../components/SquareItem';
import DetailModal from '../components/DetailModal';

type EventCard = { id: string; title: string; when: string; where?: string; desc?: string };

export default function EventsScreen() {
  const t = useTheme();
  const events: EventCard[] = useMemo(
    () => [
      { id: '1', title: 'Study Group', when: 'Mon 5–7 PM', where: 'Library', desc: 'Bring notes and laptop.' },
      { id: '2', title: 'Dinner', when: 'Tue 7 PM', where: 'Campus Cafe', desc: 'Casual hangout.' },
      { id: '3', title: 'Movie Night', when: 'Fri 8 PM', where: 'Dorm A', desc: 'Snacks provided.' },
      { id: '4', title: 'Hack Jam', when: 'Sat 2–6 PM', where: 'Lab 3', desc: 'Small teams, quick builds.' },
    ],
    []
  );
  const [selected, setSelected] = useState<EventCard | null>(null);

  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '700', marginBottom: t.space.md }}>
        Events
      </Text>

      <FlatList
        data={events}
        keyExtractor={(it) => it.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: t.space.xl }}
        renderItem={({ item }) => (
          <SquareItem
            title={item.title}
            subtitle={`${item.when}${item.where ? ' · ' + item.where : ''}`}
            onPress={() => setSelected(item)}
            testID={`event-${item.id}`}
          />
        )}
      />

      <DetailModal
        visible={!!selected}
        title={selected?.title ?? ''}
        body={[
          selected?.when ? `When: ${selected.when}` : '',
          selected?.where ? `Location: ${selected.where}` : '',
          selected?.desc ? `\n${selected.desc}` : '',
        ]
          .filter(Boolean)
          .join('\n')}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}
