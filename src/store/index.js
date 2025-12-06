import { createStore } from 'vuex'

const defaultBadgeStats = () => ({
  visitedPaths: [],
  createdDirectory: false,
  createdFile: false,
  removedDirectory: false,
  manUses: 0,
  tutorialCompleted: false,
});

const defaultState = () => ({
  commandHistory: [],
  commandHistoryTimestamp: null,
  badgeState: {
    earned: {},
    stats: defaultBadgeStats(),
  },
  robotSoundEnabled: true,
});

const loadPersistedState = () => {
  if (typeof window === 'undefined') {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem('linuxTerminalStore');
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      badgeState: {
        earned: parsed?.badgeState?.earned || {},
        stats: { ...defaultBadgeStats(), ...(parsed?.badgeState?.stats || {}) },
      },
      robotSoundEnabled: typeof parsed?.robotSoundEnabled === 'boolean'
        ? parsed.robotSoundEnabled
        : true,
    };
  } catch (error) {
    return defaultState();
  }
};

const persistencePlugin = (store) => {
  store.subscribe((mutation, state) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('linuxTerminalStore', JSON.stringify(state));
  });
};

export default createStore({
  state: loadPersistedState(),
  getters: {},
  mutations: {
    setCommandHistory(state, payload) {
      state.commandHistory = payload?.history || [];
      state.commandHistoryTimestamp = payload?.timestamp || null;
    },
    setBadgeState(state, payload) {
      if (payload?.earned) {
        state.badgeState.earned = { ...payload.earned };
      }
      if (payload?.stats) {
        state.badgeState.stats = { ...state.badgeState.stats, ...payload.stats };
      }
    },
    setRobotSoundEnabled(state, enabled) {
      state.robotSoundEnabled = !!enabled;
    },
  },
  actions: {},
  modules: {},
  plugins: [persistencePlugin],
})
