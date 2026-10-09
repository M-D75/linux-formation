import { sessionClient } from '../../services/sessionClient.js'

// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const sessionMethods = {
  leaveSessionMode() {
    this.stopParticipantTelemetry()
    this.$store.commit('clearSessionContext')
    this.telemetryQueue = []
    this.telemetryLastError = ''
  },

  getSessionPath() {
    if (this.currentNode) {
      const rawPath = this.getPath(this.currentNode)
      const normalized = rawPath ? rawPath.replace('root', '') || '/' : '/'
      return normalized || '/'
    }
    return this.pwd || '/'
  },

  queueTelemetryEvent(type, payload = {}, options = {}) {
    if (!this.isParticipantSession) {
      return
    }

    this.telemetryQueue.push({
      type,
      timestamp: new Date().toISOString(),
      payload: {
        ...payload,
        learningMode: this.learningMode,
        path:
          typeof payload.path === 'string' && payload.path.trim()
            ? payload.path.trim()
            : this.getSessionPath(),
      },
    })

    if (this.telemetryQueue.length > 100) {
      this.telemetryQueue = this.telemetryQueue.slice(-100)
    }

    if (options.immediate) {
      this.flushTelemetryQueue()
    }
  },

  async flushTelemetryQueue() {
    if (!this.isParticipantSession) {
      this.telemetryQueue = []
      return
    }

    if (this.telemetryFlushPromise) {
      return this.telemetryFlushPromise
    }

    if (this.telemetryQueue.length === 0) {
      return
    }

    const batch = this.telemetryQueue.slice(0, 50)
    this.telemetryQueue = this.telemetryQueue.slice(batch.length)

    this.telemetryFlushPromise = sessionClient
      .sendEvents(this.sessionCode, this.sessionContext.participantToken, batch)
      .catch(error => {
        this.telemetryQueue = [...batch, ...this.telemetryQueue].slice(-100)
        this.telemetryLastError = error?.message || this.t('terminal.syncError')
      })
      .finally(() => {
        this.telemetryFlushPromise = null
        if (this.telemetryQueue.length > 0 && this.isParticipantSession) {
          setTimeout(() => {
            this.flushTelemetryQueue()
          }, 400)
        }
      })

    return this.telemetryFlushPromise
  },

  startParticipantTelemetry() {
    if (!this.isParticipantSession || this.telemetryHeartbeatTimer) {
      return
    }

    this.queueTelemetryEvent(
      'heartbeat',
      {
        currentStep: this.tutorial.currentStep,
        currentStepId: this.currentTutorialStep?.id || null,
      },
      { immediate: true },
    )

    this.telemetryHeartbeatTimer = setInterval(() => {
      this.queueTelemetryEvent('heartbeat', {
        currentStep: this.tutorial.currentStep,
        currentStepId: this.currentTutorialStep?.id || null,
      })
      this.flushTelemetryQueue()
    }, 15000)
  },

  stopParticipantTelemetry() {
    if (this.telemetryHeartbeatTimer) {
      clearInterval(this.telemetryHeartbeatTimer)
      this.telemetryHeartbeatTimer = null
    }

    this.flushTelemetryQueue()
  },
}
