# Project03_Frontend
CST438 Project 03 Frontend Repo

11/5/25 (alana) -------
## Frontend Deployment Setup (Heroku + Expo Web)

- **Heroku Project info:**
- All of you have been added as collaborators (via school email)
- Heroku Project Name: proj3-front
- Heroku project link: `https://proj3-front-b36a8636efd0.herokuapp.com/`

- **Project location:** `friendsync/friendsync-app/`  
  - All frontend files (`package.json`, `Procfile`, `src/`, `node_modules/`) live here.

- **Heroku buildpacks (order matters):**
  1. `https://github.com/timanovsky/subdir-heroku-buildpack` – enters the correct subdirectory.
  2. `heroku/nodejs` – builds and serves the Node.js / Expo web app.

- **Heroku config variable:**
  ```bash
  heroku config:set PROJECT_PATH=friendsync/friendsync-app -a <app-name>

- **Procfile (inside friendsync-app/):**
web: npm run start:deploy

- **package.json scripts (inside friendsync-app/, DO NOT CHANGE!*):**
"scripts": {
  "start": "expo start",
  "build": "expo export",
  "start:deploy": "serve -s dist",
  "heroku-postbuild": "npm run build"
},
"engines": {
  "node": "22.x",
  "npm": "10.x"
}

- **Required dependencies: expo, expo-cli, serve**

- **Deployment flow (auto-deploy from deployment branch):**
1. Heroku enters friendsync-app/ via subdir buildpack.
2. Installs dependencies.
3. Runs npm run build → generates static web bundle (dist/).
4. Serves the web bundle via npm run start:deploy.

- **Developer tips:**
Always work inside friendsync-app/ for npm installs, builds, or starts.
Don’t move the folder or create a second package.json in the repo root.

Test locally before pushing:
npm run build
npm run start:deploy

Check Heroku Build logs if deployment fails.





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