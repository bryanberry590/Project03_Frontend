// src/screens/EventsScreen.tsx

import { useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import RowItem from '../components/RowItem';
import DetailModal from '../components/DetailModal';

// fields for lists
type EventRow = { id: string; title: string; when: string; where?: string; desc?: string };

export default function EventsScreen() {
  const t = useTheme();

  // mock data - asked chat gpt got too lazy to make up events
  const events: EventRow[] = useMemo(
    () => [
      { id: '1', title: 'Study Group', when: 'Mon 5–7 PM', where: 'Library', desc: 'Bring notes and laptop.' },
      { id: '2', title: 'Dinner',      when: 'Tue 7 PM',    where: 'Campus Cafe', desc: 'Casual hangout.' },
      { id: '3', title: 'Movie Night', when: 'Fri 8 PM',    where: 'Dorm A', desc: 'Snacks provided.' },
      { id: '4', title: 'Hack Jam',    when: 'Sat 2–6 PM',  where: 'Lab 3', desc: 'Small teams, quick builds.' },
    ],
    []
  );

  const [selected, setSelected] = useState<EventRow | null>(null);

  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '700', marginBottom: t.space.md }}>
        Events
      </Text>

      {/* Single-column, vertically scrollable, compact rows */}
      <FlatList
        data={events}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingBottom: t.space.xl }}
        renderItem={({ item }) => (
          <RowItem
            title={item.title}
            subtitle={item.where}
            rightLabel={item.when}
            onPress={() => setSelected(item)}      // open
            testID={`event-${item.id}`}
          />
        )}
      />

      <DetailModal
        visible={!!selected}
        title={selected?.title ?? ''}
        body={[
          selected?.when ? `When: ${selected.when}` : '',
          selected?.where ? `Where: ${selected.where}` : '',
          selected?.desc ? `\n${selected.desc}` : '',
        ].filter(Boolean).join('\n')}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}
