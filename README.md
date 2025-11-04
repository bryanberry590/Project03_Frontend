# Project03_Frontend
CST438 Project 03 Frontend Repo

10/29/25 (alana) ----
Calendar Libraries Used:

This project uses two different calendar libraries in React Native to handle different types of calendar views:

1. react-native-calendar (used in CalendarScreen.tsx)

Install:

npm install react-native-calendar


Documentation: https://github.com/wix/react-native-calendar

Purpose: Provides a simple, scrollable calendar view for selecting dates or displaying events in a traditional calendar style (no time ranges, dates only).

Notes for Teammates:

Check CalendarScreen.tsx for how we display events and handle date selection.

Pay attention to props like onDateSelect and custom styling options.

You may need to modify state handling to reflect selected dates in the rest of the app.

2. react-native-big-calendar (used in HomeScreen.tsx)

Install:

npm install react-native-big-calendar


Documentation: https://github.com/acro5piano/react-native-big-calendar

Purpose: Provides a week/day view similar to Google Calendar, optimized for displaying events with start/end times and color-coded types.

Notes for Teammates:

Check HomeScreen.tsx for usage examples with events, date, mode="week", and eventCellStyle.

Pay attention to how the weekOffset is used to navigate weeks.

The scrollOffsetMinutes logic automatically scrolls to the earliest event hour.

Event colors are customized via the eventCellStyle function based on the type field.

General Tips

Always make sure dates are JavaScript Date objects when passing to these libraries.

Keep the formatting consistent for event objects (fields like title, start, end, type).

Both libraries support customization, so you can adjust colors, fonts, and height to match the app theme.