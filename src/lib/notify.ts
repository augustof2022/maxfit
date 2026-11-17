// Reminders: "time to train", "time to weigh in", and the rest alarm when the screen is off.
// Android app (Capacitor): real scheduled notifications that fire even when the app is closed.
// Web app: notifications only while the app is open (a browser limit), plus an in-app banner.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Settings } from '../core/types';
import { db } from '../data/db';
import { dayKey } from '../core/rules';

export const isNative = Capacitor.isNativePlatform();

const WORKOUT_BASE = 100; // ids 100..106, one per weekday
const WEIGH_ID = 110;
const REST_ID = 200;

function hm(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

export async function askPermission(): Promise<boolean> {
  if (isNative) {
    const r = await LocalNotifications.requestPermissions();
    return r.display === 'granted';
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

/** Re-create all scheduled reminders from settings. Call after settings change and at app start. */
export async function applyReminders(s: Settings): Promise<void> {
  if (!isNative) return; // web: handled by tickWebReminders while the app is open
  const ids = [...Array.from({ length: 7 }, (_, i) => WORKOUT_BASE + i), WEIGH_ID].map((id) => ({ id }));
  await LocalNotifications.cancel({ notifications: ids });
  const list: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
  if (s.workoutReminder.enabled) {
    for (const d of s.workoutReminder.days) {
      list.push({
        id: WORKOUT_BASE + d,
        title: 'MaxFit: time to train',
        body: 'Keep your streak alive. Even a short session counts.',
        schedule: { on: { weekday: (d + 1) as any, ...hm(s.workoutReminder.time) }, allowWhileIdle: true },
      });
    }
  }
  if (s.weighReminder.enabled) {
    list.push({
      id: WEIGH_ID,
      title: 'MaxFit: weigh-in time',
      body: 'Step on the scale and log your weight.',
      schedule: { on: { weekday: (s.weighReminder.day + 1) as any, ...hm(s.weighReminder.time) }, allowWhileIdle: true },
    });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list });
}

/** Android app: alarm that fires even with the screen off when rest runs too long. */
export async function scheduleRestAlarm(afterSec: number) {
  if (!isNative) return;
  await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
  await LocalNotifications.schedule({
    notifications: [{ id: REST_ID, title: 'Rest is over', body: 'Back to work! Your next set is waiting.', schedule: { at: new Date(Date.now() + afterSec * 1000), allowWhileIdle: true } }],
  });
}

export async function cancelRestAlarm() {
  if (!isNative) return;
  await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
}

/** Web: check once a minute while the app is open; returns a banner text when a reminder is due. */
export async function tickWebReminders(s: Settings, now = new Date()): Promise<string | null> {
  const today = dayKey(now.getTime());
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const due: { key: string; text: string }[] = [];
  const w = s.workoutReminder;
  if (w.enabled && w.days.includes(now.getDay())) {
    const { hour, minute } = hm(w.time);
    if (nowMin >= hour * 60 + minute) due.push({ key: `rem-workout-${today}`, text: 'Time to train. Keep your streak alive!' });
  }
  const g = s.weighReminder;
  if (g.enabled && g.day === now.getDay()) {
    const { hour, minute } = hm(g.time);
    if (nowMin >= hour * 60 + minute) due.push({ key: `rem-weigh-${today}`, text: 'Weigh-in day. Log your weight.' });
  }
  for (const d of due) {
    if (await db.meta.get(d.key)) continue;
    await db.meta.put({ key: d.key, value: true });
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) await reg.showNotification('MaxFit', { body: d.text, icon: 'icon.svg' });
        else new Notification('MaxFit', { body: d.text });
      }
    } catch {
      /* ignore */
    }
    return d.text;
  }
  return null;
}
