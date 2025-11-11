// src/screens/CalendarScreen.tsx

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar } from "react-native-calendars"; // Calendar library
import { useTheme } from "../lib/ThemeProvider";
import db from "../lib/db";

/**
 * CalendarScreen
 *
 * Renders a month calendar that is driven by local DB contents (events,
 * availability, RSVPs). This component contains non-trivial layout math to
 * compute a grid height that fits inside the visible viewport. The code below
 * tries to be conservative and accounts for all visible chrome (header,
 * toggles, the calendar's own month/weekday header, top nav, and ScrollView
 * padding). The diagnostics printed to the console help tune the constants
 * when testing on different platforms.
 */
export default function CalendarScreen() {
  const t = useTheme();

  // --- Toggle states for different calendar layers ---
  const [showMine, setShowMine] = useState(true); // My availability
  const [showFriends, setShowFriends] = useState(true); // Friends' availability
  const [showMyEvents, setShowMyEvents] = useState(true); // My events
  const [showInvitedEvents, setShowInvitedEvents] = useState(true); // Events I'm invited to

  // ---------------------------
  // UI & data state (top-level)
  // ---------------------------

  // Data loaded from DB
  const [currentUserId, setCurrentUserId] = useState<number>(1); // seeded user id
  const [myAvailability, setMyAvailability] = useState<any[]>([]);
  const [friendAvailability, setFriendAvailability] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // initial data arrays are empty and will be populated from db

  // --- Organize events by date for fast lookup ---
  // dataByDate: map date-string -> array of normalized items to render on that day
  // Each item is normalized to { date: 'YYYY-MM-DD', time: 'HH:MM', title, type }
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
        const d = item.date || (item.startTime ? new Date(item.startTime).toISOString().slice(0, 10) : null);
        if (!d) return;
        if (!map[d]) map[d] = [];
        map[d].push({ ...item, type: "invitedEvent" });
      });
    }

    return map;
  }, [
    showMine,
    showFriends,
    showMyEvents,
    showInvitedEvents,
    myAvailability,
    friendAvailability,
    myEvents,
    invitedEvents,
    currentUserId,
  ]);

  // --- Fixed day cell size ---
  // Measure the calendar container width and compute per-day cell width to avoid overlap
  // -----------------------------------------------------------------------------
  // Sizing / layout constants
  // - We compute a per-day width from the calendar container width, then derive
  //   a per-row height to attempt a tight fit. To avoid one-off mismatches we
  //   explicitly account for every piece of vertical chrome when computing how
  //   much vertical space is available for the day grid.
  // -----------------------------------------------------------------------------
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [calendarWidth, setCalendarWidth] = useState<number | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [togglesHeight, setTogglesHeight] = useState<number>(0);
  // subtract small gaps/padding when computing cell width
  // ScrollView padding values (top and bottom) that affect available space
  const scrollPaddingTop = t.space?.lg ?? 0;
  const scrollPaddingBottom = t.space?.lg ?? 0;
  const rawWidth = calendarWidth ?? screenWidth;
  // allow day cell width to be the computed fraction of the container (no enforced minimum)
  const dayCellWidth = Math.floor((rawWidth - 8) / 7);

  // Vertical sizing: compute rows dynamically (4-6) based on visible month
  const [rows, setRows] = useState<number>(6);
  // removed enforced minimum cell height per user request
  // If we are forcing a fit, compute the exact per-row height so the rows fit the available area
  let computedDayHeight = Math.floor(dayCellWidth * 0.8);
  const extraReserve = 16; // small margin
  // Estimate of the calendar component's internal overhead (month title + weekday names)
  // These are estimates to account for the calendar chrome that sits above the day grid.
  const monthHeaderHeight = 56; // month title + nav arrows (approx)
  const weekDayHeaderHeight = 28; // weekday names row (Mon, Tue, ...)
  const calendarInnerPadding = 16; // extra padding inside calendar
  // Top navigation bar height (app-level). If your app uses a top nav outside
  // this screen, include its height here. If you can measure it at runtime,
  // replace this constant with the measured value.
  const topNavHeight = 56; // conservative estimate; adjust as needed
  // Known style margins that sit between header/toggles and the calendar
  const headerMarginBottom = t.space?.md ?? 0;
  const togglesMarginBottom = t.space?.md ?? 0;
  const scrollAffordanceMargin = 6; // marginBottom used by the small affordance bar
  // Clamp availableHeight to the actual window height when measurements look too large,
  // and subtract a small viewportReserve to account for app chrome / safe-area / unexpected padding.
  const viewportReserve = 56; // px to reduce the effective viewport by (tunable)
  const measuredViewportHeight = (() => {
    const raw = availableHeight != null ? Math.min(availableHeight, screenHeight) : screenHeight;
    return Math.max(0, raw - viewportReserve);
  })();

  // The ScrollView height includes the header and toggles (they are inside it),
  // so subtract their measured heights here to get the vertical space left for the
  // calendar component itself. Also reserve space for the calendar's internal
  // chrome (month title and weekday header) so the day grid calculation is accurate.
  const availableForGrid = measuredViewportHeight != null
    ? Math.max(0, measuredViewportHeight - extraReserve - headerHeight - headerMarginBottom - togglesHeight - togglesMarginBottom - monthHeaderHeight - weekDayHeaderHeight - scrollPaddingTop - scrollPaddingBottom - topNavHeight - scrollAffordanceMargin)
    : null;
  if (availableForGrid != null) {
    const fitHeight = Math.floor(availableForGrid / rows);
    // remove the lower minimum clamp; allow cells to shrink to fit rows
    // still cap to a reasonable max based on width and keep at least 1px to avoid zero-height
    computedDayHeight = Math.max(1, Math.min(fitHeight || Math.floor(dayCellWidth * 1.0), Math.floor(dayCellWidth * 1.0)));
  }
  let dayCellHeight = computedDayHeight;
  const [calendarContainerHeight, setCalendarContainerHeight] = useState<number | null>(null);
  // grid-only height (day rows + inner padding). The month title and weekday header
  // are treated as calendar "chrome" and handled separately so comparisons remain
  // consistent with availableForGrid (which already subtracts the chrome sizes).
  let calendarGridHeight = dayCellHeight * rows + calendarInnerPadding;
  // total rendered calendar height (grid + chrome)
  let totalCalendarHeight = calendarGridHeight + monthHeaderHeight + weekDayHeaderHeight;

  // If the calendar content is still taller than the available grid space,
  // shrink the per-row height proportionally so the full grid fits without clipping.
  // This is a conservative fallback to avoid the last row being inaccessible.
  let shrinkApplied = false;
  if (availableForGrid != null && calendarGridHeight > availableForGrid) {
    const usable = Math.max(availableForGrid - 8, 1); // small safety gap for gaps/padding
    const perRow = Math.floor(usable / rows);
    // avoid growing the cell beyond original width-based suggestion
    const newDayH = Math.max(1, Math.min(perRow, Math.floor(dayCellWidth * 1.0)));
    if (newDayH < dayCellHeight) {
      shrinkApplied = true;
      // override day cell height and recompute content height
      // (we don't mutate the const above; use local variables)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _old = dayCellHeight; // keep for debugging
      // reassign local variable used below
      // @ts-ignore reusing variable name in this scope
      computedDayHeight = newDayH;
      // apply the computed shrink to the day cell height
      computedDayHeight = newDayH;
      dayCellHeight = computedDayHeight;
    }
    // compute final grid and total heights after potential override
    calendarGridHeight = dayCellHeight * rows + calendarInnerPadding;
    totalCalendarHeight = calendarGridHeight + monthHeaderHeight + weekDayHeaderHeight;
  }
  
  // We're forcing the calendar to fit the viewport, so scrolling is on when the
  // grid doesn't fit availableForGrid (we compare grid-only heights)
  const scrollNeeded = availableForGrid == null ? true : (calendarGridHeight > availableForGrid);
  const scrollContainerHeight = calendarGridHeight;

  // Debug sizes to help troubleshoot scroll issues
  useEffect(() => {
    // eslint-disable-next-line no-console
  // console.log('calendar sizes: ' + JSON.stringify({ availableHeight, headerHeight, togglesHeight, monthHeaderHeight, weekDayHeaderHeight, topNavHeight, scrollPaddingTop, scrollPaddingBottom, calendarContainerHeight, calendarGridHeight, totalCalendarHeight, scrollContainerHeight, dayCellHeight, shrinkApplied }));
  }, [availableHeight, headerHeight, togglesHeight, calendarGridHeight, totalCalendarHeight, scrollContainerHeight, dayCellHeight]);
  // compute number of week rows for a given month (monthIndex is 0-based)
  function computeWeeksForMonth(year: number, monthIndex: number) {
    try {
      const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0=Sun..6=Sat
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      // returns an estimated number of weeks the month spans in the calendar
      return Math.max(4, Math.min(6, Math.ceil((firstWeekday + daysInMonth) / 7)));
    } catch (e) {
      return 6;
    }
  }

  // safeCalendarHeight will be computed after we decide whether scrolling is enabled
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
        }}
      >
  {/* Day number (top-left) */}
        <Text
          style={{
            color: state === "disabled" ? t.color.textMuted : t.color.text,
            fontWeight: "600",
            fontSize: 11,
            marginBottom: 1,
          }}
        >
          {date.day}
        </Text>

  {/* Display up to 2 events/availability per day (compact pills) */}
        {entries.slice(0, 2).map((entry: any, idx: number) => {
          // Assign color based on entry type
          let bg = "#3A8DFF"; // Default: my availability
          if (entry.type === "friend") bg = "#34C759";
          if (entry.type === "myEvent") bg = "#FF3B30";
          if (entry.type === "invitedEvent") bg = "#AF52DE";

          // simple contrast check to pick white or black text
          const contrastText = (hex: string) => {
            try {
              const c = hex.replace('#', '');
              const r = parseInt(c.substring(0,2),16);
              const g = parseInt(c.substring(2,4),16);
              const b = parseInt(c.substring(4,6),16);
              // relative luminance
              const l = (0.299*r + 0.587*g + 0.114*b)/255;
              return l > 0.6 ? '#000000' : '#ffffff';
            } catch { return '#ffffff'; }
          };

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
            <View key={idx} style={{ marginBottom: 1, maxWidth: dayCellWidth - 6 }}>
              <View style={{ backgroundColor: bg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: contrastText(bg), fontSize: 9 }}>
                  {label}
                </Text>
              </View>
            </View>
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

  // Load data from DB when currentUserId or toggles change or when the
  // screen regains focus. We extract the loader so it can be invoked from
  // multiple lifecycle hooks (initial mount, dependency changes, and focus).
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
  // Debug: indicate loader was called (useful to verify focus events)
  // Commented out to reduce console noise during normal development
  // eslint-disable-next-line no-console
  // console.log('Calendar: loadData called', { currentUserId });
    setLoadingData(true);
    try {
      await db.init_db();

      // my events and free time
      const myEv = await db.getEventsForUser(currentUserId);
      const myFt = await db.getFreeTimeForUser(currentUserId);

      // friends' free time
      const friendIds = await db.getFriendsForUser(currentUserId);
      const friendEntries: any[] = [];
      await Promise.all(friendIds.map(async (fid) => {
        const fFree = await db.getFreeTimeForUser(fid);
        const u = await db.getUserById(fid);
        const name = u?.username ?? `user:${fid}`;
        (fFree || []).forEach((slot: any) => friendEntries.push({ ...slot, name }));
      }));

      // invited events via RSVPs
      const rsvps = await db.getRsvpsForUser(currentUserId);
      const invited: any[] = [];
      await Promise.all((rsvps || []).map(async (r: any) => {
        try {
          const ownerEvents = await db.getEventsForUser(r.eventOwnerId);
          const ev = (ownerEvents || []).find((e: any) => (e.eventId ?? e.eventId) === r.eventId || e.eventId === r.eventId);
          if (ev) invited.push({ ...ev, rsvpStatus: r.status });
        } catch (e) {
          // ignore per-item errors
        }
      }));

      if (!mountedRef.current) return;

      // Normalize events and free-time into shape the calendar renderer expects:
      const normalizeDate = (iso?: string | null) => {
        try {
          if (!iso) return null;
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return null;
          return d.toISOString().slice(0, 10);
        } catch { return null; }
      };

      const fmtTime = (iso?: string | null) => {
        try {
          if (!iso) return '';
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return '';
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
      };

      const normalizedMyEvents = (myEv || []).map((e: any) => ({
        ...e,
        date: e.date ? (typeof e.date === 'string' ? (e.date.length >= 10 ? e.date.slice(0, 10) : e.date) : normalizeDate(e.date)) : normalizeDate(e.startTime),
        time: e.startTime ? fmtTime(e.startTime) : '',
        title: e.eventTitle ?? e.title ?? e.description ?? 'Event',
        type: 'myEvent',
      })).filter((x: any) => !!x.date);

      const normalizedMyFree = (myFt || []).map((f: any) => ({
        ...f,
        date: normalizeDate(f.startTime),
        time: fmtTime(f.startTime),
        title: f.eventTitle ?? f.title ?? 'Free',
        type: 'mine',
      })).filter((x: any) => !!x.date);

      const normalizedFriends = friendEntries.map((f: any) => ({
        ...f,
        date: f.date ? (typeof f.date === 'string' && f.date.length >= 10 ? f.date.slice(0, 10) : normalizeDate(f.date)) : normalizeDate(f.startTime),
        time: f.startTime ? fmtTime(f.startTime) : f.time ?? '',
        title: f.eventTitle ?? f.title ?? f.name ?? 'Free',
        type: 'friend',
      })).filter((x: any) => !!x.date);

      const normalizedInvited = invited.map((e: any) => ({
        ...e,
        date: e.date ? (typeof e.date === 'string' ? (e.date.length >= 10 ? e.date.slice(0, 10) : e.date) : normalizeDate(e.date)) : normalizeDate(e.startTime),
        time: e.startTime ? fmtTime(e.startTime) : '',
        title: e.eventTitle ?? e.title ?? e.description ?? 'Invited',
        type: 'invitedEvent',
      })).filter((x: any) => !!x.date);

  // Update state if still mounted
  setMyEvents(normalizedMyEvents);
  setMyAvailability(normalizedMyFree);
  setFriendAvailability(normalizedFriends);
  setInvitedEvents(normalizedInvited);
  // Debug: summary of loaded counts (commented out by request)
  // eslint-disable-next-line no-console
  // console.log('Calendar: loadData result', { myEvents: normalizedMyEvents.length, myFree: normalizedMyFree.length, friends: normalizedFriends.length, invited: normalizedInvited.length });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Calendar load failed', e);
    } finally {
      if (mountedRef.current) setLoadingData(false);
    }
  }, [currentUserId, showMine, showFriends, showMyEvents, showInvitedEvents]);

  // Call loadData on mount and when dependencies change
  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  // Reload when the screen regains focus (e.g., navigating back to the calendar)
  useFocusEffect(useCallback(() => {
    // refresh data when the screen is focused
    loadData();
    // no special cleanup required here
    return;
  }, [loadData]));

  // Fallback: also add a navigation listener in case some navigators don't
  // correctly trigger useFocusEffect in the environment (web / custom wrappers).
  // This ensures loadData is called when the screen receives focus.
  const navigationAny: any = useNavigation();
  useEffect(() => {
    if (!navigationAny || typeof navigationAny.addListener !== 'function') return;
    const unsubscribe = navigationAny.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigationAny, loadData]);

  // enable scrolling fallback when the calendar grid doesn't fit the measured grid
  const scrollEnabled = availableForGrid == null ? true : (calendarGridHeight > availableForGrid);

  // compute safeCalendarHeight after knowing whether we'll allow scrolling
  // safeCalendarHeight: the height we actually pass to the Calendar UI.
  // - If scroll is enabled (we can't fit the grid) we let the Calendar render
  //   its full height (grid + chrome) so it can be scrolled.
  // - Otherwise we clamp the grid to the available grid space (minus a small
  //   buffer) and add back the calendar chrome height.
  const safeCalendarHeight = (() => {
    const buffer = 12; // small safety buffer for grid comparisons
    if (scrollEnabled) return totalCalendarHeight;
    if (availableForGrid == null) return totalCalendarHeight;
    const maxAllowedGrid = Math.max(availableForGrid - buffer, dayCellHeight);
    const gridToUse = Math.min(calendarGridHeight, maxAllowedGrid);
    return gridToUse + monthHeaderHeight + weekDayHeaderHeight;
  })();

  // compute a content minHeight so the ScrollView can scroll fully to the last row
  // keep a modest bottom pad so the final row isn't obscured
  const extraBottomPad = 96; // increased to ensure final row isn't obscured on small viewports
  const contentMinHeight = Math.max(
    // prefer the measured available height (when present) so devtools/resizing
    // which change the viewport don't create large empty gaps; fall back to
    // screenHeight when availableHeight is not yet measured.
    (availableHeight ?? screenHeight) + extraBottomPad,
    // or the full content height (header + controls + calendar) + pad
    headerHeight + togglesHeight + totalCalendarHeight + extraBottomPad,
  );

  // No programmatic scrolling here — focus on accurate sizing math.

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bg, padding: t.space.lg }}
  contentContainerStyle={{ paddingBottom: extraBottomPad }}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        // log measured viewport/container height
        // Commented out to reduce console spam during normal dev
        // eslint-disable-next-line no-console
        // console.log('onLayout: ScrollView height: ' + JSON.stringify({ measuredHeight: h, availableHeight: Math.min(h, screenHeight) }));
        // clamp the measured available height to the screen height so we never trust inflated values
        setAvailableHeight(Math.min(h, screenHeight));
      }}
      nestedScrollEnabled={true}
  // allow scrolling only when we need it (avoids extra scroll behavior when not necessary)
  scrollEnabled={scrollEnabled}
    >
      {/* --- Screen Header --- */}
      <Text
        style={{
          color: t.color.text,
          fontSize: t.font.h1,
          fontWeight: "600",
          marginBottom: t.space.md,
        }}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
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
        onLayout={(e) => setTogglesHeight(e.nativeEvent.layout.height)}
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
  {/* spacer removed per request (programmatic scroll + padding remain) */}
      

      {/* --- Calendar Component --- */}
      <View onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          const h = e.nativeEvent.layout.height;
            // eslint-disable-next-line no-console
            // console.log('onLayout: Calendar container size: ' + JSON.stringify({ measuredWidth: w, measuredHeight: h, calendarWidth, calendarContainerHeight }));
            setCalendarWidth(w);
            setCalendarContainerHeight(h);
        }} style={{ width: '100%' }}>
        <Calendar
          // clamp calendar height to the safe computed value so it fits the viewport
          style={{ height: safeCalendarHeight }}
          dayComponent={renderDay} // Custom day renderer
          onVisibleMonthsChange={(months: any[]) => {
            if (!months || months.length === 0) return;
            const first = months[0];
            const y = Number(first.year) || new Date().getFullYear();
            const m = Number(first.month) || (new Date().getMonth() + 1);
            const monthIndex = m - 1;
            const w = computeWeeksForMonth(y, monthIndex);
            setRows(w);
            // eslint-disable-next-line no-console
            // console.log('onVisibleMonthsChange: ' + JSON.stringify({ year: y, month: m, rows: w }));
          }}
          theme={{
            monthTextColor: "#ffffff", // Month title color -> white
            dayTextColor: t.color.text, // Default day number color
            arrowColor: "#ffffff", // Month navigation arrows -> white
            backgroundColor: t.color.surface, // Calendar background
            calendarBackground: t.color.surface,
            textSectionTitleColor: t.color.text, // Weekday names
            textDisabledColor: t.color.textMuted, // Disabled days
            todayTextColor: "#FF9500", // Today highlight
            textMonthFontSize: 22,
            textMonthFontWeight: '700',
          }}
        />
      </View>
      {/* Detailed runtime diagnostics for layout math (console only). This
          prints a compact JSON object with all the measured and computed
          values used for sizing — helpful when tuning for different devices. */}
      {(() => {
        // Detailed layout diagnostics are commented out to reduce console noise.
        // Uncomment the following console.log during troubleshooting.
        // eslint-disable-next-line no-console
        // console.log('layout diagnostics: ' + JSON.stringify({
        //   screenWidth,
        //   screenHeight,
        //   calendarWidth,
        //   rawWidth,
        //   availableHeight,
        //   measuredViewportHeight,
        //   viewportReserve,
        //   headerHeight,
        //   togglesHeight,
        //   availableForGrid,
        //   rows,
        //   dayCellWidth,
        //   dayCellHeight,
        //   calendarGridHeight,
        //   totalCalendarHeight,
        //   topNavHeight,
        //   calendarContainerHeight,
        //   headerMarginBottom,
        //   togglesMarginBottom,
        //   scrollAffordanceMargin,
        //   scrollPaddingTop,
        //   scrollPaddingBottom,
        //   safeCalendarHeight,
        //   overflows: availableForGrid != null ? calendarGridHeight > availableForGrid : null,
        //   shrinkApplied,
        // }));
        return null;
      })()}
    </ScrollView>
  );
}
