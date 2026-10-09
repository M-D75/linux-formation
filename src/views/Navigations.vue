<template>
    <v-container>
        <div class="session-banner">
            <div class="session-banner__meta">
                <v-chip
                    size="small"
                    variant="flat"
                    :color="isParticipantSession ? 'primary' : (sessionMode === 'admin' ? 'deep-purple-accent-2' : 'blue-grey-darken-1')"
                >
                    {{ sessionModeLabel }}
                </v-chip>
                <span
                    v-if="sessionParticipantName"
                    class="session-banner__text"
                >
                    {{ t('navigation.bannerParticipant', { name: sessionParticipantName }) }}
                </span>
                <span
                    v-else-if="sessionMode === 'admin' && sessionCode"
                    class="session-banner__text"
                >
                    {{ t('navigation.bannerAdminConnected', { code: sessionCode }) }}
                </span>
            </div>

            <div class="session-banner__actions">
                <v-btn
                    class="session-banner__button"
                    size="small"
                variant="flat"
                :to="{ name: 'session-access' }"
            >
                    {{ t('common.session') }}
                </v-btn>
                <v-btn
                    v-if="hasActiveSessionContext"
                    class="session-banner__button session-banner__button--ghost"
                    size="small"
                    variant="flat"
                    @click="leaveSessionMode"
                >
                    {{ t('navigation.leave') }}
                </v-btn>
            </div>
        </div>
        <div
            class="floating-robot"
            @mouseenter="handleRobotHover"
            @mouseleave="handleRobotLeave"
            @click.stop="toggleRobotSound"
        >
            <img
                :src="robotImage"
                :alt="t('navigation.robotAlt')"
                :class="['robot-sprite', { 'robot-jump': robotJumping, 'robot-flicker': robotFlicker }]"
            />
            <div
                v-if="robotTooltip.visible && !(tutorial.active && !tutorial.completed) && !(isPermissionsMission && permissionsMission.active)"
                :class="['robot-tooltip', `robot-tooltip--${robotTooltip.type}`]"
            >
                <v-icon
                    v-if="robotTooltip.icon"
                    class="robot-tooltip-icon"
                    size="16"
                >
                    {{ robotTooltip.icon }}
                </v-icon>
                <span v-html="robotTooltip.message"></span>
            </div>
            <div
                v-if="robotSoundToast.visible"
                class="robot-sound-toggle"
            >
                {{ robotSoundToast.message }}
            </div>
        </div>
        <v-dialog
            v-model="tutorial.showIntro"
            max-width="520"
        >
            <v-card>
                <v-card-title class="text-h6 mission-title">
                    <v-icon color="cyan-lighten-1" class="mr-2">mdi-rocket-launch</v-icon>
                    {{ t('navigation.missionTitle') }}
                </v-card-title>
                <v-card-text class="mission-intro">
                    <p class="text-body-2" v-html="t('navigation.missionIntro1')"></p>
                    <br>
                    <p class="text-body-2">
                        🎯 <span class="font-weight-bold text-subtitle-1">{{ t('navigation.missionObjectiveLabel') }}</span> :
                        <br>
                        {{ t('navigation.missionObjectiveIntro') }}
                          <br> - <span class="font-weight-medium">{{ t('navigation.missionObservation') }}</span> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>pwd</code></v-chip>
                          <br> - <span class="font-weight-medium">{{ t('navigation.missionExploration') }}</span> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>ls|cd</code></v-chip>
                          <br> - <span class="font-weight-medium">{{ t('navigation.missionCleanup') }}</span> <strong>archives</strong> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>rm</code></v-chip>
                          <br> - <span class="font-weight-medium">{{ t('navigation.missionRestoration') }}</span> <strong>mission/briefing.txt</strong> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>touch</code></v-chip>
                          <br> - <span class="font-weight-medium">{{ t('navigation.missionBackup') }}</span> <strong>backups</strong> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>cp</code></v-chip>
                    </p>
                    <br>
                    <p class="text-body-2" v-html="t('navigation.missionQuestion')"></p>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn variant="text" color="secondary" @click="skipTutorial">
                        {{ t('navigation.skip') }}
                    </v-btn>
                    <v-btn color="primary" @click="beginTutorial">
                        {{ t('navigation.startTutorial') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog
            v-model="nanoEditor.show"
            persistent
            max-width="720"
        >
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon class="mr-2" color="deep-purple-accent-2">mdi-pencil</v-icon>
                    {{ nanoEditor.filePath ? t('navigation.editorTitle', { path: nanoEditor.filePath }) : t('navigation.editorFallbackTitle') }}
                </v-card-title>
                <v-card-text>

                    <v-textarea
                        v-model="nanoEditor.content"
                        rows="12"
                        auto-grow
                        variant="outlined"
                        :label="t('navigation.editorContentLabel')"
                    ></v-textarea>

                    <v-alert
                        v-if="nanoEditor.error"
                        type="error"
                        density="compact"
                        class="mt-4"
                    >
                        {{ nanoEditor.error }}
                    </v-alert>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn variant="text" color="secondary" @click="closeNanoEditor">
                        {{ t('common.cancel') }}
                    </v-btn>
                    <v-btn color="primary" @click="saveNanoEditor">
                        {{ t('common.save') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <div class="mission-toolbar">
            <div class="mission-picker">
                <v-select
                    v-model="activeMissionId"
                    :items="missionOptions"
                    item-title="title"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :label="t('navigation.missionSelectorLabel')"
                >
                    <template #item="{ props, item }">
                        <v-list-item
                            v-bind="props"
                            :prepend-icon="item.raw.icon"
                            :subtitle="item.raw.description"
                        ></v-list-item>
                    </template>
                    <template #selection="{ item }">
                        <div class="mission-picker__selection">
                            <v-icon size="18">{{ item.raw.icon }}</v-icon>
                            <span>{{ item.raw.title }}</span>
                        </div>
                    </template>
                </v-select>
            </div>

            <div class="mission-mode-control">
                <span class="learning-mode-label">{{ t('navigation.missionModeLabel') }}</span>
                <v-btn-toggle
                    v-model="missionMode"
                    mandatory
                    density="compact"
                    variant="outlined"
                    color="primary"
                    divided
                    :aria-label="t('navigation.missionModeLabel')"
                >
                    <v-tooltip
                        v-for="mode in missionModeOptions"
                        :key="mode.value"
                        :text="mode.description"
                        location="bottom"
                    >
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                :value="mode.value"
                                size="small"
                            >
                                <v-icon size="16" class="mr-1">{{ mode.icon }}</v-icon>
                                {{ mode.label }}
                            </v-btn>
                        </template>
                    </v-tooltip>
                </v-btn-toggle>
            </div>
        </div>

        <div class="learning-toolbar">
            <div class="learning-mode-control">
                <span class="learning-mode-label">{{ t('navigation.learningModeLabel') }}</span>
                <v-btn-toggle
                    v-model="learningMode"
                    mandatory
                    density="compact"
                    variant="outlined"
                    color="primary"
                    divided
                    :aria-label="t('navigation.learningModeLabel')"
                >
                    <v-tooltip
                        v-for="mode in learningModeOptions"
                        :key="mode.value"
                        :text="mode.description"
                        location="bottom"
                    >
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                :value="mode.value"
                                size="small"
                            >
                                <v-icon size="16" class="mr-1">{{ mode.icon }}</v-icon>
                                {{ mode.label }}
                            </v-btn>
                        </template>
                    </v-tooltip>
                </v-btn-toggle>
            </div>

            <div class="learning-toolbar__actions">
                <v-btn
                    class="badge-toggle-btn"
                    variant="tonal"
                    color="secondary"
                    size="small"
                    @click="showBadgePanel = !showBadgePanel"
                >
                    {{ t('navigation.badgesToggle', { action: showBadgePanel ? t('common.hide') : t('common.show'), earned: earnedBadgesCount, total: badges.length }) }}
                </v-btn>
                <v-tooltip :text="t('navigation.resetTooltip')" location="bottom">
                    <template #activator="{ props }">
                        <v-btn
                            v-bind="props"
                            icon="mdi-restart"
                            variant="tonal"
                            color="error"
                            size="small"
                            :aria-label="t('navigation.resetTraining')"
                            @click="confirmResetTraining"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </div>
        </div>
        <!-- Main container for command input and tree visualization -->
        <section class="mission-overview" :aria-label="t('navigation.currentObjective')">
                <v-slide-y-transition>
                    <v-card
                        v-if="tutorial.active && !tutorial.showIntro && !tutorial.completed"
                        class="tutorial-card"
                        variant="text"
                        style="padding-bottom: 0px; margin-bottom: 0px;"
                    >
                        <div class="objective-eyebrow">{{ t('navigation.currentObjective') }}</div>
                        <v-card-title class="text-subtitle-1">
                            {{ currentTutorialStep ? currentTutorialStep.title : '' }}
                        </v-card-title>

                        <v-card-text>
                            <div class="objective-instruction-label">{{ t('navigation.instructionLabel') }}</div>
                            <div class="tutorial-description" v-html="currentTutorialStep ? formatLearningText(currentTutorialStep.description) : ''"></div>
                            <details v-if="showCommandAssist && currentTutorialStep?.concept" :key="currentTutorialStep.id" class="objective-help">
                                <summary>{{ t('navigation.stepHelp') }}</summary>
                                <div v-html="formatLearningText(currentTutorialStep.concept)"></div>
                            </details>
                            <div
                                v-if="tutorial.feedback"
                                class="tutorial-feedback"
                                :class="tutorial.feedbackType === 'success' ? 'is-success' : 'is-hint'"
                            >
                                <v-icon
                                    size="18"
                                    class="feedback-icon"
                                    :color="tutorial.feedbackType === 'success' ? 'green-darken-2' : 'amber-darken-3'"
                                >
                                    {{ tutorial.feedbackType === 'success' ? 'mdi-check-circle' : 'mdi-lightbulb-on' }}
                                </v-icon>
                                <span v-html="highlightCommandNames(tutorial.feedback)"></span>
                            </div>
                        </v-card-text>

                        <v-card-actions class="justify-space-between info-step-tutorial">
                            <v-btn variant="text" size="small" @click="skipTutorial">
                                {{ t('navigation.skipTutorial') }}
                            </v-btn>
                            <div class="text-caption">
                                {{ t('navigation.stepCounter', { current: tutorial.currentStep + 1, total: tutorial.steps.length }) }}
                            </div>
                        </v-card-actions>
                    </v-card>
                </v-slide-y-transition>

                <v-slide-y-transition>
                    <v-card
                        v-if="isPermissionsMission && permissionsMission.active"
                        class="permission-mission-card"
                        variant="text"
                    >
                        <div class="objective-eyebrow">{{ t('navigation.currentObjective') }}</div>
                        <v-card-title class="permission-mission-card__title">
                            <v-icon color="teal-darken-2" class="mr-2">mdi-shield-key-outline</v-icon>
                            <span>
                                {{ missionMode === 'challenge' ? t('navigation.permissionChallengeTitle') : (currentPermissionMissionStep ? currentPermissionMissionStep.title : t('navigation.permissionLearningTitle')) }}
                            </span>
                        </v-card-title>

                        <v-card-text>
                            <div class="objective-instruction-label">{{ t('navigation.instructionLabel') }}</div>
                            <div
                                v-if="missionMode === 'challenge'"
                                class="tutorial-description"
                                v-html="formatLearningText(t('navigation.permissionChallengeObjective'))"
                            ></div>
                            <div
                                v-else
                                class="tutorial-description"
                                v-html="currentPermissionMissionStep ? formatLearningText(currentPermissionMissionStep.description) : ''"
                            ></div>

                            <details
                                v-if="missionMode !== 'challenge' && showCommandAssist && currentPermissionMissionStep?.guidance"
                                :key="currentPermissionMissionStep.id"
                                class="permission-step-guide objective-help"
                            >
                                <summary>{{ t('navigation.stepHelp') }}</summary>
                                <div class="permission-step-guide__label">
                                    {{ currentPermissionMissionStep.guidance.title }}
                                </div>
                                <v-chip
                                    v-if="currentPermissionMissionStep.guidance.command"
                                    size="small"
                                    color="teal"
                                    variant="elevated"
                                    class="permission-step-guide__command"
                                    prepend-icon="mdi-console"
                                    @click="selectPermissionGuideCommand(currentPermissionMissionStep.guidance.command)"
                                >
                                    <code>{{ currentPermissionMissionStep.guidance.command }}</code>
                                </v-chip>
                                <div
                                    class="permission-step-guide__note"
                                    v-html="formatLearningText(currentPermissionMissionStep.guidance.note)"
                                ></div>
                            </details>

                            <div
                                v-if="permissionsMission.feedback"
                                class="tutorial-feedback"
                                :class="permissionsMission.feedbackType === 'success' ? 'is-success' : 'is-hint'"
                            >
                                <v-icon
                                    size="18"
                                    class="feedback-icon"
                                    :color="permissionsMission.feedbackType === 'success' ? 'green-darken-2' : 'amber-darken-3'"
                                >
                                    {{ permissionsMission.feedbackType === 'success' ? 'mdi-check-circle' : 'mdi-lightbulb-on' }}
                                </v-icon>
                                <span v-html="highlightCommandNames(permissionsMission.feedback)"></span>
                            </div>
                        </v-card-text>

                        <v-card-actions class="permission-mission-actions justify-space-between">
                            <v-btn
                                class="permission-restart-btn"
                                variant="text"
                                size="small"
                                @click="setupPermissionsMission()"
                            >
                                {{ t('navigation.restartMission') }}
                            </v-btn>
                            <div
                                class="permission-step-counter text-caption"
                                v-if="missionMode !== 'challenge'"
                            >
                                {{ t('navigation.stepCounter', { current: permissionsMission.completed ? permissionsMission.steps.length : permissionsMission.currentStep + 1, total: permissionsMission.steps.length }) }}
                            </div>
                            <v-chip
                                v-else
                                size="small"
                                color="teal"
                                variant="tonal"
                            >
                                {{ t('navigation.immediateFeedback') }}
                            </v-chip>
                        </v-card-actions>
                    </v-card>
                </v-slide-y-transition>

        </section>

        <div class="cont-cmd-graph-navigaion" style="display: flex; position: relative;" ref="mainPanel">
            <div
                v-if="signals.length"
                class="signal-layer"
            >
                <div
                    v-for="sig in signals"
                    :key="sig.id"
                    class="signal-anim"
                    :style="sig.style"
                ></div>
            </div>
            <!-- Command input section -->
            <div class="cont-cmd">
                <div class="workspace-heading workspace-heading--terminal">
                    <v-icon size="20">mdi-console</v-icon>
                    <h2>{{ t('navigation.terminalTitle') }}</h2>
                    <span>{{ t('navigation.executeHint') }}</span>
                </div>
                <v-divider color="success"></v-divider>

                <v-snackbar
                    v-model="permissionsMission.showSuccess"
                    timeout="4500"
                    location="top"
                    color="teal"
                    variant="tonal"
                >
                    <v-icon>mdi-shield-check</v-icon><span>{{ t('navigation.permissionMissionDone') }}</span>
                </v-snackbar>

                <v-snackbar
                    v-model="tutorial.showSuccess"
                    timeout="4000"
                    location="top"
                    color="primary"
                    variant="tonal"
                >
                    <v-icon>mdi-check</v-icon><span>{{ t('navigation.missionDone') }}</span>
                </v-snackbar>

                <v-navigation-drawer
                    class="badge-panel"
                    location="right"
                    temporary
                    width="280"
                    v-model="showBadgePanel"
                >
                    <v-toolbar
                        flat
                        color="transparent"
                        density="compact"
                    >
                        <v-toolbar-title>{{ t('navigation.badges') }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-btn icon variant="text" @click="showBadgePanel = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar>
                    <v-divider></v-divider>
                    <v-card
                        variant="flat"
                        color="transparent"
                    >
                        <v-card-text>
                            <v-row dense>
                                <v-col
                                    v-for="badge in badges"
                                    :key="badge.id"
                                    cols="6"
                                >
                                            <v-tooltip :text="badge.description" location="bottom">
                                                <template v-slot:activator="{ props }">
                                            <v-card
                                                v-bind="props"
                                                :class="['badge-item', badge.earned ? 'badge-earned-card' : 'badge-locked-card']"
                                                :elevation="badge.earned ? 8 : 2"
                                                variant="flat"
                                            >
                                                <v-card-text class="text-center">
                                                    <v-icon
                                                        size="28"
                                                        :class="badge.earned ? 'badge-icon-earned' : 'badge-icon-locked'"
                                                    >
                                                        {{ badge.icon }}
                                                    </v-icon>
                                                    <div class="text-caption" style="margin-top: 6px;">
                                                        {{ badge.title }}
                                                    </div>
                                                </v-card-text>
                                            </v-card>
                                        </template>
                                    </v-tooltip>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-navigation-drawer>

                <transition name="badge-unlock">
                    <div
                        v-if="badgeSnackbar.show"
                        class="badge-unlock-toast"
                    >
                        <div class="badge-glow"></div>
                        <div class="badge-unlock-content">
                            <div class="badge-icon-wrapper" v-if="badgeSnackbar.icon">
                                <v-icon class="badge-icon" size="36">
                                    {{ badgeSnackbar.icon }}
                                </v-icon>
                            </div>
                            <div class="badge-unlock-text">
                                <div class="badge-unlock-label">
                                    {{ t('navigation.achievementUnlocked') }}
                                </div>
                                <div class="badge-unlock-name">
                                    {{ badgeSnackbar.message }}
                                </div>
                                <div class="badge-unlock-description" v-if="badgeSnackbar.description">
                                    {{ badgeSnackbar.description }}
                                </div>
                            </div>
                            <v-btn
                                color="amber-accent-1"
                                variant="text"
                                size="small"
                                class="badge-view-btn"
                                @click="openBadgePanel"
                            >
                                {{ t('common.view') }}
                            </v-btn>
                        </div>
                    </div>
                </transition>

                <!-- Command output section -->
                <v-list 
                    class="output-cmd"
                    :class="{ 'is-scrolling': terminalScrolling, 'is-scrollbar-near': terminalScrollbarNear }"
                    @scroll.passive="showTerminalScrollbar"
                    @pointermove="trackTerminalScrollbar"
                    @pointerleave="terminalScrollbarNear = false"
                    ref="outputCmd"
                    role="log"
                    aria-live="polite"
                    :aria-label="t('navigation.terminalOutputLabel')"
                    base-color="white"
                    bg-color="#333"
                >
                    <template
                        v-for="(cmd, index) in commandHistory"
                        :key="index"
                    >
                        <v-list-item>
                            <div v-if="commandHistory.length-(cursorHistory) != index">
                                <v-list-item-title  v-html="`<span style='color: #33ff90'>$ ${cmd.command.split(' ')[0]}</span> ${cmd.command.split(' ').slice(1).join(' ')} `"></v-list-item-title>

                                <v-list-item-subtitle v-html="cmd.output.replaceAll('\n', '<br>')"></v-list-item-subtitle>
                            </div>

                            <div v-else>
                                <v-list-item-title  v-html="`<span style='color: #33ff90'>$ ${cmd.command.split(' ')[0]}</span> ${cmd.command.split(' ').slice(1).join(' ')} <i class='mdi-map-marker mdi in-terminal-i v-icon' aria-hidden='true'></i>`"></v-list-item-title>

                                <v-list-item-subtitle v-html="cmd.output.replaceAll('\n', '<br>')"></v-list-item-subtitle>
                            </div>
                        </v-list-item>
                    </template>
                </v-list>
                <div class="terminal-entry">
                    <div v-if="showCommandAssist" class="terminal-suggestions-label">{{ t('navigation.commandSuggestionsLabel') }}</div>
        <v-slide-y-transition>
            <div v-if="showCommandAssist" class="command-suggestions global">
                <template v-if="commandSuggestions.length">
                    <template
                        v-for="cmd in commandSuggestions"
                        :key="cmd"
                    >
                        <v-tooltip :text="commandDescriptions[cmd] || ''" location="top">
                            <template #activator="{ props }">
                                <v-chip
                                    v-bind="props"
                                    size="small"
                                    color="blue"
                                    label
                                    variant="elevated"
                                    class="suggestion-chip chip-fade-drop"
                                    @click="selectCommandSuggestion(cmd)"
                                >
                                    <span class="font-weight-medium">{{ cmd }}</span>
                                </v-chip>
                            </template>
                        </v-tooltip>
                    </template>
                </template>

                <template v-else>
                    <v-tooltip
                        v-if="!hasNoCommandMatch"
                        :text="t('navigation.helpTooltip')"
                        location="bottom"
                    >
                        <template #activator="{ props }">
                            <v-chip
                                v-bind="props"
                                color="amber"
                                variant="elevated"
                                class="suggestion-chip chip-fade-drop"
                                @click="injectHelpCommand"
                            >
                                <v-icon start>mdi-help-circle</v-icon>
                                {{ t('navigation.terminalHelp') }}
                            </v-chip>
                        </template>
                    </v-tooltip>

                    <v-tooltip
                        v-if="hasNoCommandMatch"
                        :text="t('navigation.noCommandMatchTooltip')"
                        location="bottom"
                    >
                        <template #activator="{ props }">
                            <v-chip
                                v-bind="props"
                                color="deep-orange-accent-3"
                                variant="elevated"
                                class="suggestion-chip chip-fade-drop"
                                prepend-icon="mdi-alert-octagon"
                                @click="injectHelpCommand"
                            >
                                {{ t('common.warning') }}
                            </v-chip>
                        </template>
                    </v-tooltip>
                </template>
            </div>
        </v-slide-y-transition>

                <div class="command-input-wrapper" :class="{ 'hint-active': showCommandHint }" ref="commandInputWrapper">
                    <v-text-field
                        v-model="command"
                        ref="commandInput"
                        flat
                        prefix="$"
                        color="white"
                        theme="dark"
                        base-color="white"
                        bg-color="#333"
                        variant="solo"
                        hide-details
                        autocomplete="off"
                        :label="t('navigation.commandLabel')"
                        @focus="dismissCommandHint"
                        @keydown.enter.prevent="executeCommand()"
                        @keyup="handleInputKeyup($event)"
                        @keydown.tab.prevent="autoCompleteCommand"
                        :placeholder="t('navigation.commandPlaceholder')"
                        ><template #append-inner>
                            <v-btn color="teal-lighten-3" variant="tonal" size="small" :disabled="!command.trim()" @click="executeCommand()">{{ t('navigation.executeAction') }}</v-btn>
                        </template>
                    </v-text-field>
                    <transition name="badge-unlock">
                        <div
                            v-if="showCommandHint && showCommandAssist"
                            class="command-input-hint"
                            role="button"
                            tabindex="0"
                            @click="focusCommandInput"
                            @keydown.enter.prevent="focusCommandInput"
                            @keydown.space.prevent="focusCommandInput"
                        >
                            <v-icon class="mr-1" size="18">mdi-lightning-bolt</v-icon>
                            {{ t('navigation.firstCommandHint') }}
                            <span class="hint-arrow">↵</span>
                        </div>
                    </transition>
                </div>

                </div>
            </div>

            <!-- Tree visualization section -->
            <div class="tree-panel" :class="{ 'tree-panel--permissions': isPermissionsMission }">
                <div class="workspace-heading">
                    <v-icon size="20">{{ isPermissionsMission ? 'mdi-shield-key-outline' : 'mdi-file-tree' }}</v-icon>
                    <h2>{{ isPermissionsMission ? t('navigation.permissionInspectorTitle') : t('navigation.treeTitle') }}</h2>
                </div>
                <div class="workspace-location">{{ t('navigation.currentLocation') }} <code>{{ pwd || t('navigation.locationUnknown') }}</code></div>
                <div
                    v-if="isPermissionsMission"
                    class="permission-inspector"
                >
                    <div class="permission-inspector__header">
                        <div>
                            <div class="permission-inspector__eyebrow">{{ t('navigation.permissionInspectorEyebrow') }}</div>
                            <h2>{{ t('navigation.permissionInspectorTitle') }}</h2>
                        </div>
                        <v-chip
                            color="teal"
                            variant="tonal"
                            prepend-icon="mdi-account-key-outline"
                        >
                            {{ currentUser }}
                        </v-chip>
                    </div>

                    <div class="permission-context-grid">
                        <div class="permission-context">
                            <span>{{ t('navigation.permissionActiveUser') }}</span>
                            <strong>{{ currentUser }}</strong>
                        </div>
                        <div class="permission-context">
                            <span>{{ t('navigation.permissionActiveGroups') }}</span>
                            <strong>{{ currentGroups.join(', ') }}</strong>
                        </div>
                    </div>

                    <div class="permission-targets">
                        <div class="permission-section-title">{{ t('navigation.permissionTargetsTitle') }}</div>
                        <v-chip-group
                            v-model="selectedPermissionPath"
                            column
                            mandatory
                        >
                            <v-chip
                                v-for="target in permissionTargets"
                                :key="target.path"
                                :value="target.path"
                                :prepend-icon="target.type === 'd' ? 'mdi-folder-key-outline' : 'mdi-file-key-outline'"
                                :color="selectedPermissionPath === target.path ? 'teal' : 'blue-grey'"
                                variant="tonal"
                            >
                                {{ target.label }} <code>{{ target.rights }}</code>
                            </v-chip>
                        </v-chip-group>
                    </div>

                    <div
                        v-if="selectedPermissionMeta"
                        class="permission-selected"
                    >
                        <div class="permission-selected__meta">
                            <div>
                                <span>{{ t('navigation.permissionSelectedTarget') }}</span>
                                <strong>{{ selectedPermissionMeta.name }}</strong>
                            </div>
                            <code>{{ selectedPermissionMeta.rights }}</code>
                        </div>
                        <div class="permission-selected__owner">
                            {{ t('navigation.permissionOwnerGroupLine', { owner: selectedPermissionMeta.user, group: selectedPermissionMeta.group }) }}
                        </div>
                        <div class="permission-selected__summary">
                            {{ selectedPermissionSummary }}
                        </div>
                    </div>

                    <div class="permission-matrix">
                        <div class="permission-section-title">{{ t('navigation.permissionMatrixTitle') }}</div>
                        <div
                            v-for="row in permissionInspectorRows"
                            :key="row.key"
                            :class="['permission-row', { 'permission-row--active': row.active }]"
                        >
                            <div class="permission-row__identity">
                                <strong>{{ row.label }}</strong>
                                <code>{{ row.triplet }} = {{ row.digit }}</code>
                            </div>
                            <div class="permission-row__bits">
                                <v-chip
                                    size="small"
                                    :color="row.read ? 'lime-darken-1' : 'blue-grey'"
                                    variant="flat"
                                >
                                    r
                                </v-chip>
                                <v-chip
                                    size="small"
                                    :color="row.write ? 'red-lighten-1' : 'blue-grey'"
                                    variant="flat"
                                >
                                    w
                                </v-chip>
                                <v-chip
                                    size="small"
                                    :color="row.execute ? 'light-blue-darken-1' : 'blue-grey'"
                                    variant="flat"
                                >
                                    x
                                </v-chip>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="missionMode === 'challenge'"
                        class="permission-checks"
                    >
                        <div class="permission-section-title">{{ t('navigation.permissionChallengeChecks') }}</div>
                        <div
                            v-for="check in permissionChallengeChecks"
                            :key="check.id"
                            :class="['permission-check', { 'permission-check--passed': check.passed }]"
                        >
                            <v-icon size="18">
                                {{ check.passed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                            </v-icon>
                            <span>{{ check.label }}</span>
                        </div>
                    </div>
                </div>

                <div
                    v-show="!isPermissionsMission"
                    class="tree-legend"
                    :aria-label="t('navigation.treeLegendTitle')"
                >
                    <div class="tree-legend__title">{{ t('navigation.treeLegendTitle') }}</div>
                    <div class="tree-legend__item">
                        <span class="tree-legend__marker tree-legend__marker--folder"></span>
                        {{ t('navigation.treeLegendFolder') }}
                    </div>
                    <div class="tree-legend__item">
                        <span class="tree-legend__marker tree-legend__marker--file"></span>
                        {{ t('navigation.treeLegendFile') }}
                    </div>
                    <div class="tree-legend__item">
                        <span class="tree-legend__marker tree-legend__marker--current"></span>
                        {{ t('navigation.treeLegendCurrent') }}
                    </div>
                    <div class="tree-legend__item">
                        <span class="tree-legend__marker tree-legend__marker--preview"></span>
                        {{ t('navigation.treeLegendPreview') }}
                    </div>
                    <div class="tree-legend__item">
                        <span class="tree-legend__line"></span>
                        {{ t('navigation.treeLegendPath') }}
                    </div>
                </div>
                <div
                    id="tree"
                    ref="tree"
                    v-show="!isPermissionsMission"
                    :aria-label="t('navigation.treeAriaLabel')"
                ></div>
            </div>
        </div>

        <!-- Breadcrumbs for current directory path -->
        <div style="margin-top: 20px;">
            <v-breadcrumbs 
                v-if="pwd.split('/').slice(1).length > 0"
            >
                <div 
                    v-for="(dir, k) in pwd.split('/').slice(1)"
                    :key="k"
                >
                    <v-breadcrumbs-divider
                        v-if="k==0"
                        class="bounce"
                    >
                        <v-icon 
                            icon="mdi-circle-medium"
                            style="opacity: 0.8;"
                        ></v-icon>
                    </v-breadcrumbs-divider>

                    <v-breadcrumbs-item
                        class="bounce"
                    >
                        {{ dir }}
                    </v-breadcrumbs-item>

                    <v-breadcrumbs-divider
                        v-if="k!=pwd.split('/').slice(1).length-1"
                        class="bounce"
                    >
                        <v-icon icon="mdi-chevron-right"></v-icon>
                    </v-breadcrumbs-divider>

                    <v-breadcrumbs-divider
                        v-else
                        class="bounce"
                    >
                        <v-icon icon="mdi-map-marker"></v-icon>
                    </v-breadcrumbs-divider>
                    <!-- mdi-map-marker -->
                </div>
            </v-breadcrumbs>

            <!-- Tooltip for current directory -->
            <div
                v-else
                style="padding: 7px 19px;"
            >

                <div v-if="pwd.length > 0">
                    <v-icon 
                        icon="mdi-circle-medium"
                    >
                    </v-icon>
                </div>

                <v-tooltip 
                    v-else
                    max-width="250"
                    :text="t('navigation.pwdTooltip')"
                >
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            v-bind="props"
                            icon
                            variant="plain"
                            class="bounce"
                            @click="command='pwd'"
                        >
                            <v-icon 
                                icon="mdi-map-marker-question"
                            >
                            </v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>

            </div>

            <!-- chmod command information -->
            <div v-if="chmodInfos.data.user.length > 0">
                <h3 style="text-align: center; font-weight: 200;">
                    {{ t('navigation.chmodCommand') }} <span style="font-weight: bold;">chmod</span>
                    <v-tooltip 
                        max-width="250"
                        :text="t('navigation.chmodTooltip')"
                    >
                        <template v-slot:activator="{ props }">
                            <v-btn 
                                v-bind="props"
                                icon
                                variant="plain"
                                class="bounce"
                                @click="command='chmod 755 <filename>'"
                            >
                                <v-icon 
                                    icon="mdi-information-slab-circle-outline"
                                >
                                </v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </h3>

                <h2 style="text-align: center; font-weight: 200;">{{ t('navigation.chmodTarget', { type: chmodInfos.rights.charAt(0) == '-' ? t('navigation.file') : t('navigation.folder') }) }} <span style="font-weight: bold;">{{ chmodInfos.fileName }}</span></h2>
                
                <div
                    class="cont-chmod-card"
                    style="display: flex;"
                >
                    <!-- User permissions -->
                    <v-card
                        class="mx-auto bounce"
                    >
                        <!-- <v-list :items="chmodInfos.data.user"></v-list> -->
                        <v-list>
                            <v-list-item
                                v-for="(item, index) in chmodInfos.data.user"
                                :key="index"
                                :value="index"
                            >
                                <template v-slot:prepend>
                                    <v-icon v-if="item.props?.prependIcon" :color="item.props?.color">
                                        {{ item.props.prependIcon }}
                                    </v-icon>
                                </template>

                                <v-list-item-title v-html="item.title"></v-list-item-title>

                                <template v-slot:append>
                                    <v-icon v-if="item.props?.appendIcon" :color="item.props?.color">
                                        {{ item.props.appendIcon }}
                                    </v-icon>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card>

                    <!-- Group permissions -->
                    <v-card
                        class="mx-auto bounce"
                    >
                        <!-- <v-list :items="chmodInfos.data.group"></v-list> -->
                        <v-list>
                            <v-list-item
                                v-for="(item, index) in chmodInfos.data.group"
                                :key="index"
                                :value="index"
                            >
                                <template v-slot:prepend>
                                    <v-icon v-if="item.props?.prependIcon" :color="item.props?.color">
                                        {{ item.props.prependIcon }}
                                    </v-icon>
                                </template>

                                <v-list-item-title>{{ item.title }}</v-list-item-title>

                                <template v-slot:append>
                                    <v-icon v-if="item.props?.appendIcon" :color="item.props?.color">
                                        {{ item.props.appendIcon }}
                                    </v-icon>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card>

                    <!-- Other permissions -->
                    <v-card
                        class="mx-auto bounce"
                    >
                        <!-- <v-list :items="chmodInfos.data.other"></v-list> -->
                        <v-list>
                            <v-list-item
                                v-for="(item, index) in chmodInfos.data.other"
                                :key="index"
                                :value="index"
                            >
                                <template v-slot:prepend>
                                    <v-icon v-if="item.props?.prependIcon" :color="item.props?.color">
                                        {{ item.props.prependIcon }}
                                    </v-icon>
                                </template>

                                <v-list-item-title v-html="item.title"></v-list-item-title>

                                <template v-slot:append>
                                    <v-icon v-if="item.props?.appendIcon" :color="item.props?.color">
                                        {{ item.props.appendIcon }}
                                    </v-icon>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </div>

            </div>

            <!-- chmod permissions legend -->
            <div
                v-if="chmodInfos.data.user.length > 0"
                style="width: 100%; margin: 10px 0px;"
            >
                <div style="display: flex;  width: fit-content; margin: auto;">
                    <div 
                        v-for="(l, i) in [
                                {t:'r', bgc:'#DCF50CAA', c:'black'}, 
                                {t:'w', bgc:'#F51B0CAA', c:'white'}, 
                                {t:'x', bgc:'#0C81F5AA', c:'white'},
                                {t:'-', bgc:'#3D6FA0AA', c:'white', val:0}
                            ]"
                        :key="i"
                    >
                        <div 
                            :style="{backgroundColor: l.bgc, color:l.c}"
                            style="
                                text-align: center; 
                                padding: 2px 5px; 
                                border-bottom: 1px dashed white"
                        >{{ l.t }}</div>

                        <div 
                            :style="{backgroundColor: l.bgc, color:l.c}"
                            style="
                                text-align: center; 
                                padding: 2px 5px;"
                        >{{ l.val != undefined ? l.val : 2**(2-i) }}</div>
                    </div>
                </div>
            </div>

            <!-- Animation for directory change -->
            <div id="output_animate" ref="output_animate"></div>

            <!-- Command history -->
            <div 
                id="history-cmd"
            >
                <!-- <v-chip-group
                    v-if="commandHistory.length"
                    column
                    label="Historique des commandes"
                > -->
                    <div 
                        v-if="commandHistory.filter((cmd) => cmd.command != '').length==0"
                        style="text-align: center;"
                    >
                        <v-chip 
                            color="white"
                            prepend-icon="mdi-information-slab-circle-outline"
                            class="bounce"
                        >
                            {{ t('navigation.commandHistory') }}
                        </v-chip>
                    </div>

                    <div v-else>
                        <template
                            v-for="(cmd, index) in commandHistory.filter((cmd) => cmd.command != '')"
                            :key="index"
                        >
                            <v-tooltip :text="getHistoryTooltip(cmd)" :disabled="!getHistoryTooltip(cmd)" max-width="320" location="top">
                                <template #activator="{ props }">
                                    <v-chip 
                                        v-bind="props"
                                        :color="cmd.state == 'valid' ? 'green-accent-2' : (cmd.state == 'error' ? 'red-lighten-1' : 'amber-accent-4')"
                                        :prepend-icon="cmd.state == 'valid' ? 'mdi-check-circle' : (cmd.state == 'error' ? 'mdi-close-circle' : 'mdi-alert-circle')"
                                        :append-icon="commandHistory.length-(cursorHistory) == index ? 'mdi-map-marker' : ''"
                                        class="bounce"
                                        @click="command = cmd.command"
                                    >
                                        {{ cmd.command }}
                                    </v-chip>
                                </template>
                            </v-tooltip>
                        </template>
                    </div>
                <!-- </v-chip-group> -->
            </div>
        </div>
    </v-container>
</template>
  
<script src="../features/training/workspace.js"></script>
  
<style lang="scss" src="../features/training/workspace.scss"></style>

<style lang="scss" scoped src="../features/training/tree.scss"></style>
