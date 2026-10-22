// Shared helpers for the tests: pretend versions of the things that only exist on a phone.

const Module = require('node:module');
const path = require('node:path');

const BUILD = path.join(__dirname, '..', '..', '.test-build');

// Load one of the app's files (built by tests/helpers/build.js).  e.g. app('src/db/index.js')
function app(file) {
  return require(path.join(BUILD, file));
}

// Make `require('some-phone-library')` return our pretend version instead.
// Always include 'expo-sqlite' (the phone database) so the app's database code can load.
function installFakes(fakes) {
  const all = { 'expo-sqlite': {}, ...fakes };
  const original = Module._load;
  Module._load = function (request, ...rest) {
    if (Object.prototype.hasOwnProperty.call(all, request)) return all[request];
    return original.call(this, request, ...rest);
  };
}

// A pretend phone database. It is real SQL (Node's built-in SQLite), held in memory.
function makeTestDb() {
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  return {
    raw,
    execAsync: async (sql) => raw.exec(sql),
    runAsync: async (sql, params = []) => raw.prepare(sql).run(...params),
    getAllAsync: async (sql, params = []) => raw.prepare(sql).all(...params),
    getFirstAsync: async (sql, params = []) => raw.prepare(sql).get(...params) ?? null,
  };
}

// Run some code while the clock is frozen at a chosen time (October 19, 2026).
async function atTime(hour, minute, run) {
  const RealDate = Date;
  const fixed = () => new RealDate(2026, 9, 19, hour, minute, 0);
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length) super(...args);
      else super(fixed().getTime());
    }
    static now() {
      return fixed().getTime();
    }
  };
  try {
    return await run();
  } finally {
    global.Date = RealDate;
  }
}

// A pretend phone: permissions you can switch, and records of what the app asked it to do.
function createPhone() {
  const phone = {
    tasks: {}, // the background jobs the app registered
    position: { coords: { latitude: 25.2, longitude: 55.27 } },
    reset() {
      Object.assign(phone, {
        fg: 'granted', bg: 'granted', notif: 'granted', // what the user allowed
        throwAll: false, // true = every phone call fails, like a broken phone
        started: false, updates: false, regions: null, // what the app is watching
        scheduled: [], // notifications the app asked for
      });
    },
  };
  phone.reset();
  const guard = (value) => {
    if (phone.throwAll) throw new Error('the phone said no');
    return value;
  };
  const fakes = {
    'react-native': { Platform: { OS: 'android' } },
    'expo-task-manager': { defineTask: (name, fn) => { phone.tasks[name] = fn; } },
    'expo-location': {
      Accuracy: { Low: 2, Balanced: 3 },
      GeofencingEventType: { Enter: 1, Exit: 2 },
      getForegroundPermissionsAsync: async () => guard({ status: phone.fg }),
      getBackgroundPermissionsAsync: async () => guard({ status: phone.bg }),
      getLastKnownPositionAsync: async () => guard(phone.position),
      getCurrentPositionAsync: async () => guard(phone.position),
      hasStartedGeofencingAsync: async () => guard(phone.started),
      startGeofencingAsync: async (_name, regions) => { guard(); phone.started = true; phone.regions = regions; },
      stopGeofencingAsync: async () => { phone.started = false; phone.regions = null; },
      hasStartedLocationUpdatesAsync: async () => guard(phone.updates),
      startLocationUpdatesAsync: async () => { guard(); phone.updates = true; },
      stopLocationUpdatesAsync: async () => { phone.updates = false; },
      requestForegroundPermissionsAsync: async () => guard({ status: 'denied' }),
      requestBackgroundPermissionsAsync: async () => guard({ status: 'denied' }),
    },
    'expo-notifications': {
      AndroidImportance: { DEFAULT: 3 },
      SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
      getPermissionsAsync: async () => guard({ status: phone.notif }),
      requestPermissionsAsync: async () => guard({ status: 'denied' }),
      setNotificationChannelAsync: async () => {},
      scheduleNotificationAsync: async (notification) => { phone.scheduled.push(notification); },
      cancelAllScheduledNotificationsAsync: async () => { phone.scheduled.length = 0; },
      dismissAllNotificationsAsync: async () => {},
    },
  };
  return { phone, fakes };
}

// Run real React components without a phone: a bare-bones fake web page is enough for
// components that draw nothing (our "watcher" components only run logic).
function setupReact() {
  if (process.env.NODE_ENV === 'production') process.env.NODE_ENV = 'development'; // React needs this for test mode
  const React = require('react');
  const { createRoot } = require('react-dom/client');

  global.IS_REACT_ACT_ENVIRONMENT = true;
  global.window = global;
  for (const name of ['HTMLIFrameElement', 'HTMLElement', 'Element', 'Node', 'Text', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement']) {
    global[name] = class {};
  }
  global.document = { nodeName: '#document', nodeType: 9, createElement: () => ({ style: {} }), addEventListener() {} };

  // Show a component. Returns { unmount }.
  async function mount(element) {
    const container = {
      nodeType: 1, nodeName: 'DIV', tagName: 'DIV', style: {},
      addEventListener() {}, removeEventListener() {}, appendChild() {},
      ownerDocument: global.document,
    };
    const root = createRoot(container);
    await React.act(async () => { root.render(element); });
    return { unmount: () => React.act(async () => { root.unmount(); }) };
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  return { React, mount, act: React.act, wait };
}

module.exports = { app, installFakes, makeTestDb, atTime, createPhone, setupReact };
