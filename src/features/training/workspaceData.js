import { folderTree } from '../../data/folderTree.js'
export const LEARNING_MODE_STORAGE_KEY = 'linuxFormationLearningMode'
export const DEFAULT_LEARNING_MODE = 'guided'
export const LEARNING_MODES = ['guided', 'practice', 'evaluation']

export const buildInitialTreeData = () => {
  const localTree = JSON.parse(JSON.stringify(folderTree))

  const ensureFileContent = node => {
    if (!node || typeof node !== 'object') {
      return
    }
    if (node.type === 'f' && typeof node.content !== 'string') {
      node.content = ''
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(ensureFileContent)
    }
  }

  ensureFileContent(localTree)
  return localTree
}

export const buildPermissionsTreeData = () => ({
  name: 'root',
  type: 'd',
  rights: 'drwxr-xr-x',
  user: 'root',
  group: 'root',
  date: '24-11-23 14:00',
  children: [
    {
      name: 'home',
      type: 'd',
      rights: 'drwxr-xr-x',
      user: 'root',
      group: 'root',
      date: '24-11-23 14:00',
      children: [
        {
          name: 'alice',
          type: 'd',
          rights: 'drwxr-x---',
          user: 'alice',
          group: 'dev',
          date: '24-11-23 13:50',
          children: [
            {
              name: 'projet-alpha',
              type: 'd',
              rights: 'drwxr-x---',
              user: 'alice',
              group: 'dev',
              date: '24-11-23 13:55',
              children: [
                {
                  name: 'rapport.txt',
                  type: 'f',
                  rights: '-rw-r-----',
                  user: 'alice',
                  group: 'dev',
                  date: '24-11-23 13:56',
                  content:
                    'Rapport projet alpha\nStatut: brouillon\nAction: autoriser ecriture au groupe dev.\n',
                  children: null,
                },
                {
                  name: 'scripts',
                  type: 'd',
                  rights: 'drwxr-x---',
                  user: 'alice',
                  group: 'dev',
                  date: '24-11-23 13:57',
                  children: [
                    {
                      name: 'analyse.sh',
                      type: 'f',
                      rights: '-rw-r-----',
                      user: 'alice',
                      group: 'dev',
                      date: '24-11-23 13:58',
                      content: '#!/bin/bash\necho "Analyse projet alpha"\n',
                      children: null,
                    },
                  ],
                },
                {
                  name: 'secret',
                  type: 'd',
                  rights: 'drwx------',
                  user: 'alice',
                  group: 'dev',
                  date: '24-11-23 13:59',
                  children: [
                    {
                      name: 'notes.txt',
                      type: 'f',
                      rights: '-rw-------',
                      user: 'alice',
                      group: 'dev',
                      date: '24-11-23 14:00',
                      content: 'Notes internes du projet alpha.\n',
                      children: null,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'bob',
          type: 'd',
          rights: 'drwxr-x---',
          user: 'bob',
          group: 'dev',
          date: '24-11-23 13:45',
          children: [],
        },
      ],
    },
  ],
})

export const DEFAULT_MISSION_ID = 'navigation'
export const PERMISSIONS_MISSION_ID = 'permissions'
export const DEFAULT_MISSION_MODE = 'learn'
export const NAVIGATION_START_PATH = 'home/user'
export const PERMISSIONS_START_PATH = 'home/alice/projet-alpha'

export const loadLearningMode = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LEARNING_MODE
  }

  const stored = window.localStorage.getItem(LEARNING_MODE_STORAGE_KEY)
  return LEARNING_MODES.includes(stored) ? stored : DEFAULT_LEARNING_MODE
}
