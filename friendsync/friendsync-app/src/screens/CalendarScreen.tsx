// src/screens/CalendarScreen.tsx

import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Calendar } from "react-native-calendars"; // Calendar library
import Screen from "../components/ScreenTmp";
import { useTheme } from "../lib/ThemeProvider";
import db from "../lib/db";

export default function CalendarScreen() {
  const t = useTheme();

  // --- Toggle states for different calendar layers ---
  const [showMine, setShowMine] = useState(true); // My availability
  const [showFriends, setShowFriends] = useState(true); // Friends' availability
  const [showMyEvents, setShowMyEvents] = useState(true); // My events
  const [showInvitedEvents, setShowInvitedEvents] = useState(true); // Events I'm invited to

  // --- Dummy data ---
  const myAvailability = [
    { date: "2025-10-29", time: "9–11 AM" },
    { date: "2025-11-01", time: "1–3 PM" },
    { date: "2025-11-04", time: "All Day" },
  ];

  const friendAvailability = [
    { date: "2025-10-30", name: "Alex", time: "10–12 AM" },
    { date: "2025-11-02", name: "Jamie", time: "2–4 PM" },
    { date: "2025-11-04", name: "Taylor", time: "4–6 PM" },
  ];

  const myEvents = [
    { date: "2025-10-31", title: "Halloween Party 🎃", time: "6 PM" },
    { date: "2025-11-03", title: "Study Group", time: "5–7 PM" },
  ];

  const invitedEvents = [
    { date: "2025-11-01", title: "Friend Dinner", time: "7 PM" },
    { date: "2025-11-04", title: "Movie Night", time: "8 PM" },
  ];

  // --- Organize events by date for fast lookup ---
  const dataByDate = useMemo(() => {
    const map: Record<string, any[]> = {};

    if (showMine) {
      myAvailability.forEach((item) => {
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push({ ...item, type: "mine" });
      });
    }

    if (showFriends) {
      friendAvailability.forEach((item) => {
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push({ ...item, type: "friend" });
      });
    }

    if (showMyEvents) {
      myEvents.forEach((item) => {
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push({ ...item, type: "myEvent" });
      });
    }

    if (showInvitedEvents) {
      invitedEvents.forEach((item) => {
        if (!map[item.date]) map[item.date] = [];
        map[item.date].push({ ...item, type: "invitedEvent" });
      });
    }

    return map;
  }, [showMine, showFriends, showMyEvents, showInvitedEvents]);

  // --- Fixed day cell size ---
  const screenWidth = Dimensions.get("window").width;
  const dayCellWidth = screenWidth / 7; // divide screen width by 7 for 7 days
  const dayCellHeight = 80;

  // --- Custom day rendering for react-native-calendars ---
  const renderDay = ({ date, state }: any) => {
    const entries = dataByDate[date.dateString] || [];

    // --- Return custom day cell ---
    return (
      <View
        style={{
          width: dayCellWidth,
          height: dayCellHeight,
          borderWidth: 0.5,
          borderColor: "#ccc",
          padding: 2,
          borderRadius: 4,
          backgroundColor: state === "disabled" ? "#1c1c1c10" : "transparent",
          // Grey out days from other months if disabled
        }}
      >
        {/* Day number */}
        <Text
          style={{
            color: state === "disabled" ? t.color.textMuted : t.color.text,
            fontWeight: "600",
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          {date.day} {/* e.g., "29" */}
        </Text>

        {/* Display up to 2 events/availability per day */}
        {entries.slice(0, 2).map((entry, idx) => {
          // Assign color based on entry type
          let color = "#3A8DFF"; // Default: my availability
          if (entry.type === "friend") color = "#34C759";
          if (entry.type === "myEvent") color = "#FF3B30";
          if (entry.type === "invitedEvent") color = "#AF52DE";

          // Determine label to show in cell
          const label =
            entry.type === "myEvent"
              ? `${entry.time} ${entry.title}` // My events
              : entry.type === "invitedEvent"
              ? `${entry.time} ${entry.title}` // Invited events
              : entry.type === "friend"
              ? `${entry.name}: ${entry.time}` // Friends' availability
              : entry.time; // My availability

          return (
            <Text
              key={idx}
              numberOfLines={1} // prevent text overflow
              ellipsizeMode="tail"
              style={{ color, fontSize: 10 }}
            >
              {label}
            </Text>
          );
        })}

        {/* If more than 2 events, show "+N more" */}
        {entries.length > 2 && (
          <Text style={{ color: t.color.textMuted, fontSize: 10 }}>
            +{entries.length - 2} more
          </Text>
        )}
      </View>
    );
  };

  return (
    <Screen>
      {/* --- Screen Header --- */}
      <Text
        style={{
          color: t.color.text,
          fontSize: t.font.h1,
          fontWeight: "600",
          marginBottom: t.space.md,
        }}
      >
        Calendar
      </Text>

      {/* --- Filter Toggles --- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: t.space.md,
          flexWrap: "wrap", // allow wrapping on small screens
        }}
      >
        <Text style={{ color: t.color.text, marginBottom: 6 }}>
          Select or Deselect Calendar Views:
        </Text>

        {/* Toggle My Availability */}
        <TouchableOpacity
          onPress={() => setShowMine(!showMine)}
          style={{
            marginRight: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: showMine ? "#3A8DFF" : t.color.textMuted }}>
            My Availability
          </Text>
        </TouchableOpacity>

        {/* Toggle Friends' Availability */}
        <TouchableOpacity
          onPress={() => setShowFriends(!showFriends)}
          style={{
            marginRight: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: showFriends ? "#34C759" : t.color.textMuted }}>
            Friends
          </Text>
        </TouchableOpacity>

        {/* Toggle My Events */}
        <TouchableOpacity
          onPress={() => setShowMyEvents(!showMyEvents)}
          style={{
            marginRight: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: showMyEvents ? "#FF3B30" : t.color.textMuted }}>
            My Events
          </Text>
        </TouchableOpacity>

        {/* Toggle Invited Events */}
        <TouchableOpacity
          onPress={() => setShowInvitedEvents(!showInvitedEvents)}
          style={{
            marginRight: 10,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text
            style={{ color: showInvitedEvents ? "#AF52DE" : t.color.textMuted }}
          >
            Invited Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- Calendar Component --- */}
      <Calendar
        dayComponent={renderDay} // Custom day renderer
        theme={{
          monthTextColor: "#000000ff", // Month title color
          dayTextColor: "#000000ff", // Default day number color
          arrowColor: "#000000ff", // Month navigation arrows
          backgroundColor: t.color.surface, // Calendar background
          calendarBackground: t.color.surface,
          textSectionTitleColor: t.color.text, // Weekday names
          textDisabledColor: t.color.textMuted, // Disabled days
          todayTextColor: "#FF9500", // Today highlight
        }}

        // Notes:
        // - dayComponent: can customize how each day is displayed
        // - markingType: add dots, multi-dots, or periods
        // - onDayPress: respond to day taps
        // - hideExtraDays: hide days from adjacent months
        // Documentation: https://github.com/wix/react-native-calendars#calendar
      />
    </Screen>
  );
}
