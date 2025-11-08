import db from './db';

type SeedResult = {
  users: { id: number; username: string }[];
  events: { id: number; ownerId: number; title?: string }[];
  friends: { rowId: number; a: number; b: number }[];
  notifications: { id: number; userId: number }[];
  rsvps?: { id: number; eventId: number; inviteRecipientId: number; status?: string }[];
};

/**
 * seedDummyData - populate the DB (native or fallback) with a small set of test data.
 * Call this in development only. The function is automatically attached to globalThis.seedDummyData
 * when running in __DEV__ so you can call it from the debugger console.
 */
export async function seedDummyData(opts?: { force?: boolean }): Promise<SeedResult> {
  if (!__DEV__ && !((globalThis as any).__FORCE_SEED__ === true)) {
    throw new Error('seedDummyData can only be run in development unless __FORCE_SEED__ is set.');
  }

  await db.init_db();

  const createdUsers: { id: number; username: string }[] = [];
  const createdEvents: { id: number; ownerId: number; title?: string }[] = [];
  const createdFriends: { rowId: number; a: number; b: number }[] = [];
  const createdNotifications: { id: number; userId: number }[] = [];
  const createdRsvps: { id: number; eventId: number; inviteRecipientId: number; status?: string }[] = [];

  // Create users
  const alice = await db.createUser({ username: 'alice', email: 'alice@example.com' });
  createdUsers.push({ id: alice, username: 'alice' });

  const bob = await db.createUser({ username: 'bob', email: 'bob@example.com' });
  createdUsers.push({ id: bob, username: 'bob' });

  const carol = await db.createUser({ username: 'carol', email: 'carol@example.com' });
  createdUsers.push({ id: carol, username: 'carol' });

  // Create friendships (Alice <-> Bob accepted, Bob <-> Carol accepted)
  const fr1 = await db.sendFriendRequest(alice, bob);
  await db.respondFriendRequest(fr1, true);
  createdFriends.push({ rowId: fr1, a: alice, b: bob });

  const fr2 = await db.sendFriendRequest(bob, carol);
  await db.respondFriendRequest(fr2, true);
  createdFriends.push({ rowId: fr2, a: bob, b: carol });

  // Create events for users
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const e1 = await db.createEvent({ userId: alice, eventTitle: 'Alice Meeting', description: 'Discuss project', startTime: inOneHour, endTime: inTwoHours, date: now.toISOString() });
  createdEvents.push({ id: e1, ownerId: alice, title: 'Alice Meeting' });

  const e2 = await db.createEvent({ userId: bob, eventTitle: 'Bob Lunch', description: 'Lunch with team', startTime: inOneHour, endTime: inTwoHours, date: now.toISOString() });
  createdEvents.push({ id: e2, ownerId: bob, title: 'Bob Lunch' });

  // Free time slot for Carol
  const ft = await db.addFreeTime({ userId: carol, startTime: inOneHour, endTime: inTwoHours });
  createdEvents.push({ id: ft, ownerId: carol, title: 'Free time' });

  // Preferences
  await db.setUserPreferences(alice, { theme: 1, notificationEnabled: 1, colorScheme: 0 });
  await db.setUserPreferences(bob, { theme: 0, notificationEnabled: 1, colorScheme: 1 });

  // Notifications
  const n1 = await db.addNotification({ userId: alice, notifMsg: 'Welcome Alice!', notifType: 'welcome' });
  createdNotifications.push({ id: n1, userId: alice });

  const n2 = await db.addNotification({ userId: bob, notifMsg: 'You have a new friend', notifType: 'friend' });
  createdNotifications.push({ id: n2, userId: bob });

  // RSVPs — Bob and Carol RSVP to Alice's event, Alice RSVPs to Bob's
  try {
    const r1 = await db.createRsvp({ eventId: e1, eventOwnerId: alice, inviteRecipientId: bob, status: 'accepted' });
    createdRsvps.push({ id: r1, eventId: e1, inviteRecipientId: bob, status: 'accepted' });

    const r2 = await db.createRsvp({ eventId: e1, eventOwnerId: alice, inviteRecipientId: carol, status: 'pending' });
    createdRsvps.push({ id: r2, eventId: e1, inviteRecipientId: carol, status: 'pending' });

    const r3 = await db.createRsvp({ eventId: e2, eventOwnerId: bob, inviteRecipientId: alice, status: 'accepted' });
    createdRsvps.push({ id: r3, eventId: e2, inviteRecipientId: alice, status: 'accepted' });
  } catch (e) {
    // if RSVP functions are unavailable or fail for native reasons, continue without blocking seed
    // eslint-disable-next-line no-console
    console.warn('seed: rsvp creation failed', e);
  }

  return { users: createdUsers, events: createdEvents, friends: createdFriends, notifications: createdNotifications, rsvps: createdRsvps };
}

// Auto-attach in dev for convenience
if (__DEV__) {
  try { (globalThis as any).seedDummyData = seedDummyData; } catch (e) { /* ignore */ }
}

export default seedDummyData;
