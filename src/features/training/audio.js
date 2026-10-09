// Vue Options API methods; the workspace instance supplies shared state and collaborators.
export const audioMethods = {
  stopAllActiveAudios() {
    this.stopTalkSound()
    if (this.activeAudios && this.activeAudios.length) {
      this.activeAudios.forEach(audio => {
        try {
          audio.pause()
          audio.currentTime = 0
        } catch {
          // ignore
        }
      })
      this.activeAudios = []
    }
    Object.keys(this.audioTimers || {}).forEach(key => {
      if (this.audioTimers[key]) {
        clearTimeout(this.audioTimers[key])
        this.audioTimers[key] = null
      }
    })
  },

  loadAudioEffects() {
    if (typeof Audio === 'undefined') {
      return
    }
    this.audioSources = {
      talk: [
        '/son/robot-talk-1.mp3',
        '/son/robot-talk-2.mp3',
        '/son/robot-talk-3.mp3',
        '/son/robot-talk-birds.mp3',
        '/son/robot-talk-r2d2.mp3',
        // '/son/robot-talk-creapy.mp3',
        '/son/robot-talk-angelic.mp3',
        '/son/robot-talk-hahaha.mp3',
        '/son/robot-talk-heart.mp3',
      ],
      warning: ['/son/robot-warning.mp3', '/son/robot-warning-8-bit-1.mp3'],
      error: ['/son/robot-error-1.mp3'],
      success: ['/son/robot-succes-1.mp3', '/son/robot-success-winlevel.mp3'],
      beep: ['/son/robot-beep-1.mp3'],
    }
  },

  startTalkSound() {
    if (!this.robotSoundEnabled) {
      return
    }
    if (this.talkLoopAudio) {
      return
    }
    const talks = this.audioSources?.talk || []
    if (!talks.length) {
      return
    }
    const src = talks[Math.floor(Math.random() * talks.length)]
    try {
      const audio = new Audio(src)
      audio.loop = true
      const playPromise = audio.play()
      if (playPromise?.catch) {
        playPromise.catch(() => {})
      }
      this.talkLoopAudio = audio
    } catch {
      this.talkLoopAudio = null
    }
  },

  stopTalkSound() {
    if (this.talkLoopAudio) {
      try {
        this.talkLoopAudio.pause()
        this.talkLoopAudio.currentTime = 0
      } catch {
        // ignore
      }
      this.talkLoopAudio = null
    }
  },

  playSoundEffect(type) {
    if (!this.robotSoundEnabled) {
      return
    }
    const sources = this.audioSources[type] || []
    if (!sources.length) {
      return
    }
    const src = sources[Math.floor(Math.random() * sources.length)]
    let audio
    try {
      audio = new Audio(src)
    } catch {
      return
    }
    const stopAudio = () => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch {
        // ignore
      }
      this.activeAudios = this.activeAudios.filter(entry => entry !== audio)
    }
    audio.addEventListener('ended', stopAudio)
    const playPromise = audio.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {})
    }
    this.activeAudios.push(audio)
    const durationHints = {
      talk: 2500,
      warning: 2600,
      error: 2800,
      success: 3200,
      beep: 1200,
    }
    const timeout = durationHints[type] || 2800
    if (this.audioTimers[type]) {
      clearTimeout(this.audioTimers[type])
    }
    this.audioTimers[type] = setTimeout(() => {
      stopAudio()
      this.audioTimers[type] = null
    }, timeout)
  },

  toggleRobotSound() {
    const nextState = !this.robotSoundEnabled
    this.robotSoundEnabled = nextState
    if (!nextState) {
      this.stopTalkSound()
      this.stopAllActiveAudios()
    }
    this.showRobotSoundToast(
      nextState ? this.t('terminal.soundOn') : this.t('terminal.soundOff'),
    )
    if (nextState) {
      this.playSoundEffect('beep')
    }
  },

  showRobotSoundToast(message) {
    if (this.robotSoundToast.timer) {
      clearTimeout(this.robotSoundToast.timer)
      this.robotSoundToast.timer = null
    }
    this.robotSoundToast.message = message
    this.robotSoundToast.visible = true
    this.robotSoundToast.timer = setTimeout(() => {
      this.robotSoundToast.visible = false
      this.robotSoundToast.timer = null
    }, 1500)
  },
}
