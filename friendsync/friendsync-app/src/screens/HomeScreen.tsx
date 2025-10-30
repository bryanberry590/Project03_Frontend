// src/screens/HomeScreen.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import { Calendar } from 'react-native-big-calendar';

// --- Helper: shift date by N days ---
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// --- Helper: get Sunday of the week for a given date ---
const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay(); // 0 = Sunday
  start.setDate(start.getDate() - day); // shift back to Sunday
  start.setHours(0, 0, 0, 0); // start of day
  return start;
};

export default function HomeScreen() {
  const t = useTheme();

  // Week offset allows navigation (0 = current week, ±1 = next/previous week)
  const [weekOffset, setWeekOffset] = useState(0);

  // --- Calculate start and end of visible week ---
  const today = new Date();
  const baseWeekStart = getStartOfWeek(today); // Sunday of current week
  const startDate = addDays(baseWeekStart, weekOffset * 7); // adjust by offset
  const endDate = addDays(startDate, 6); // Saturday
  endDate.setHours(23, 59, 59, 999); // include entire day

  // --- Dummy events ---
  const dummyEvents = useMemo(
    () => [
      { title: 'Team Sync (Hosting)', start: new Date(2025, 9, 30, 10, 0), end: new Date(2025, 9, 30, 11, 0), type: 'hosted' },
      { title: "Friends Birthday Dinner", start: new Date(2025, 9, 31, 18, 0), end: new Date(2025, 9, 31, 21, 0), type: 'invited' },
      { title: 'Free Time', start: new Date(2025, 10, 1, 9, 0), end: new Date(2025, 10, 1, 15, 0), type: 'availability' },
      { title: 'Coffee with Alex', start: new Date(2025, 10, 3, 10, 30), end: new Date(2025, 10, 3, 11, 30), type: 'invited' },
      { title: 'Friendsgiving', start: new Date(2025, 10, 5, 13, 0), end: new Date(2025, 10, 5, 14, 0), type: 'hosted' },
      { title: 'Dinner with Family', start: new Date(2025, 10, 6, 19, 0), end: new Date(2025, 10, 6, 21, 0), type: 'invited' },
      { title: 'Free Time', start: new Date(2025, 10, 8, 9, 0), end: new Date(2025, 10, 8, 15, 0), type: 'availability' },
    ],
    []
  );

  // --- Filter events to only show those in current week ---
  const visibleEvents = dummyEvents.filter(
    e => e.start >= startDate && e.start <= endDate
  );

  // --- Auto-scroll: find earliest event hour to scroll calendar ---
  const eventHours = visibleEvents.flatMap(e => [e.start.getHours(), e.end.getHours()]);
  const earliestHour = eventHours.length ? Math.min(...eventHours) : 8; // default 8am
  const scrollOffsetMinutes = Math.max((earliestHour - 1) * 60, 0); // scroll offset in minutes

  // --- Event colors ---
  const eventCellStyle = (event: any) => {
    switch (event.type) {
      case 'availability':
        return { backgroundColor: '#3A8DFF' }; // blue
      case 'hosted':
        return { backgroundColor: '#FF3B30' }; // red
      case 'invited':
        return { backgroundColor: '#AF52DE' }; // purple
      default:
        return { backgroundColor: '#ccc' }; // fallback grey
    }
  };

  return (
    <Screen>
      {/* --- Screen Header --- */}
      <Text
        style={{
          color: t.color.text,
          fontSize: t.font.h1,
          fontWeight: '700',
          marginBottom: t.space.xs,
        }}
      >
        Welcome to FriendSync
      </Text>
      <Text style={{ color: t.color.textMuted, marginBottom: t.space.md }}>
        Sync up!
      </Text>

      {/* --- Subtitle --- */}
      <Text
        style={{
          color: t.color.text,
          fontSize: t.font.h2,
          fontWeight: '600',
          marginBottom: t.space.sm,
        }}
      >
        Weekly Calendar
      </Text>

      {/* --- Week Navigation --- */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: t.space.sm,
        }}
      >
        <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)}>
          <Text style={{ color: t.color.text }}>← Previous</Text>
        </TouchableOpacity>
        <Text style={{ color: t.color.textMuted, fontWeight: '500' }}>
          {startDate.toDateString()} – {endDate.toDateString()}
        </Text>
        <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)}>
          <Text style={{ color: t.color.text }}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* --- Color Legend --- */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: t.space.sm,
          paddingVertical: 4,
        }}
      >
        {/* Availability */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#3A8DFF' }} />
          <Text style={{ color: t.color.text }}>Availability</Text>
        </View>
        {/* Hosted Event */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#FF3B30' }} />
          <Text style={{ color: t.color.text }}>Hosted Event</Text>
        </View>
        {/* Invited Event */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#AF52DE' }} />
          <Text style={{ color: t.color.text }}>Invited Event</Text>
        </View>
      </View>

      {/* --- Calendar Component --- */}
      <View style={{ height: 600 }}>
        <Calendar
          events={visibleEvents} // array of events to show
          date={startDate} // starting date of week
          height={500}
          mode="week" // week view
          scrollOffsetMinutes={scrollOffsetMinutes} // auto-scroll to first event
          eventCellStyle={eventCellStyle} // style function for events
          swipeEnabled={false} // disable swipe between weeks
          showTime={true} // show time labels
          headerContainerStyle={{ backgroundColor: 'transparent' }} // remove default header background
          hourStyle={{ color: t.color.textMuted }} // color of hour labels
        />
      </View>
    </Screen>
  );
}
