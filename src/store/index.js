import { createStore } from 'vuex'

const defaultBadgeStats = () => ({
  visitedPaths: [],
  createdDirectory: false,
  createdFile: false,
  removedDirectory: false,
  manUses: 0,
  tutorialCompleted: false,
});

const defaultSessionContext = () => ({
  mode: 'offline',
  sessionCode: '',
  sessionLabel: '',
  participantId: '',
  participantName: '',
  participantFirstName: '',
  participantLastName: '',
  participantEmail: '',
  participantToken: '',
  adminToken: '',
});

const defaultState = () => ({
  commandHistory: [],
  commandHistoryTimestamp: null,
  badgeState: {
    earned: {},
    stats: defaultBadgeStats(),
  },
  robotSoundEnabled: true,
  sessionContext: defaultSessionContext(),
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
      sessionContext: {
        ...defaultSessionContext(),
        ...(parsed?.sessionContext || {}),
      },
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
    setSessionParticipant(state, payload) {
      state.sessionContext = {
        ...defaultSessionContext(),
        mode: 'participant',
        sessionCode: payload?.sessionCode || '',
        sessionLabel: payload?.sessionLabel || '',
        participantId: payload?.participantId || '',
        participantName: payload?.participantName || '',
        participantFirstName: payload?.participantFirstName || '',
        participantLastName: payload?.participantLastName || '',
        participantEmail: payload?.participantEmail || '',
        participantToken: payload?.participantToken || '',
      };
    },
    setSessionAdmin(state, payload) {
      state.sessionContext = {
        ...defaultSessionContext(),
        mode: 'admin',
        sessionCode: payload?.sessionCode || '',
        sessionLabel: payload?.sessionLabel || '',
        adminToken: payload?.adminToken || '',
      };
    },
    clearSessionContext(state) {
      state.sessionContext = defaultSessionContext();
    },
  },
  actions: {},
  modules: {},
  plugins: [persistencePlugin],
})
