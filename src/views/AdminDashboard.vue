<template>
    <v-container class="admin-dashboard">
        <v-row justify="center">
            <v-col cols="12" lg="10">
                <div class="admin-dashboard__header">
                    <div>
                        <div class="admin-dashboard__eyebrow">{{ t('admin.eyebrow') }}</div>
                        <h1 class="admin-dashboard__title">{{ t('admin.title') }}</h1>
                        <p class="admin-dashboard__subtitle">
                            {{ t('admin.subtitle') }}
                        </p>
                    </div>
                    <div class="admin-dashboard__header-actions">
                        <v-btn variant="text" :to="{ name: 'session-access' }">
                            {{ t('admin.joinSession') }}
                        </v-btn>
                        <v-btn variant="text" :to="{ name: 'home' }">
                            {{ t('admin.backToPlatform') }}
                        </v-btn>
                        <v-btn
                            v-if="adminUnlocked"
                            variant="text"
                            color="error"
                            @click="lockAdminAccess"
                        >
                            {{ t('admin.lock') }}
                        </v-btn>
                    </div>
                </div>
            </v-col>
        </v-row>

        <v-row v-if="!adminUnlocked" justify="center" class="mb-6">
            <v-col cols="12" md="7" lg="5">
                <v-card class="admin-card" elevation="10">
                    <v-card-title>{{ t('admin.eyebrow') }}</v-card-title>
                    <v-card-text>
                        <p class="text-body-2 mb-4">
                            {{ t('admin.passwordDescription') }}
                        </p>
                        <v-text-field
                            v-model="adminPassword"
                            :label="t('admin.trainerPassword')"
                            type="password"
                            variant="outlined"
                            autocomplete="current-password"
                            @keyup.enter="unlockAdminAccess"
                        />
                        <v-alert
                            v-if="accessError"
                            type="error"
                            density="compact"
                        >
                            {{ accessError }}
                        </v-alert>
                    </v-card-text>
                    <v-card-actions class="admin-card__actions">
                        <v-btn color="primary" :loading="accessLoading" block @click="unlockAdminAccess">
                            {{ t('admin.accessTracking') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked" justify="center" class="mb-6">
            <v-col cols="12" md="5">
                <v-card class="admin-card" elevation="8">
                    <v-card-title>{{ t('admin.createSession') }}</v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="newSessionLabel"
                            :label="t('admin.sessionName')"
                            variant="outlined"
                            :placeholder="t('admin.sessionNamePlaceholder')"
                        />
                        <v-alert
                            v-if="createError"
                            type="error"
                            density="compact"
                        >
                            {{ createError }}
                        </v-alert>
                    </v-card-text>
                    <v-card-actions class="admin-card__actions">
                        <v-btn color="primary" :loading="createLoading" block @click="createSession">
                            {{ t('admin.create') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" md="5">
                <v-card class="admin-card" elevation="8">
                    <v-card-title>{{ t('admin.openExistingSession') }}</v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="manualSessionCode"
                            :label="t('session.sessionCode')"
                            variant="outlined"
                            maxlength="6"
                            placeholder="ABC123"
                            class="mb-3"
                        />
                        <v-text-field
                            v-model="manualAdminToken"
                            :label="t('admin.adminKey')"
                            variant="outlined"
                            :placeholder="t('admin.adminKeyPlaceholder')"
                        />
                        <v-alert
                            v-if="loadError"
                            type="error"
                            density="compact"
                            class="mt-4"
                        >
                            {{ loadError }}
                        </v-alert>
                    </v-card-text>
                    <v-card-actions class="admin-card__actions">
                        <v-btn color="primary" :loading="loadLoading" block @click="connectToExistingSession">
                            {{ t('common.open') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked" justify="center" class="mb-6">
            <v-col cols="12" lg="10">
                <v-card class="admin-card" elevation="8">
                    <v-card-title class="admin-session__title">
                        <div>
                            <div class="text-subtitle-1">{{ t('admin.availableSessions') }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ t('admin.availableSessionsCaption', { count: sessionsList.length }) }}
                            </div>
                        </div>
                        <v-btn size="small" variant="outlined" @click="refreshSessionsList">
                            {{ t('common.refresh') }}
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <v-table class="admin-session__table">
                            <thead>
                                <tr>
                                    <th>{{ t('admin.session') }}</th>
                                    <th>{{ t('common.status') }}</th>
                                    <th>{{ t('common.participants') }}</th>
                                    <th>{{ t('common.commands') }}</th>
                                    <th>{{ t('admin.creation') }}</th>
                                    <th>{{ t('common.action') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="sessionItem in sessionsList" :key="sessionItem.code">
                                    <td>
                                        <div class="font-weight-medium">{{ sessionItem.label || sessionItem.code }}</div>
                                        <div class="text-caption">{{ sessionItem.code }}</div>
                                    </td>
                                    <td>
                                        <v-chip
                                            size="small"
                                            :color="sessionItem.status === 'active' ? 'green' : 'blue-grey'"
                                            variant="tonal"
                                        >
                                            {{ formatState(sessionItem.status) }}
                                        </v-chip>
                                    </td>
                                    <td>{{ sessionItem.metrics?.participantsCount || 0 }}</td>
                                    <td>{{ sessionItem.metrics?.commandsCount || 0 }}</td>
                                    <td>{{ formatDate(sessionItem.createdAt) }}</td>
                                    <td>
                                        <v-btn
                                            size="small"
                                            variant="text"
                                            color="primary"
                                            @click="openSessionFromList(sessionItem)"
                                        >
                                            {{ t('admin.useCode') }}
                                        </v-btn>
                                    </td>
                                </tr>
                                <tr v-if="sessionsList.length === 0">
                                    <td colspan="6" class="text-center text-medium-emphasis">
                                        {{ t('admin.noSessions') }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked && activeSessionCode && activeAdminToken" justify="center">
            <v-col cols="12" lg="10">
                <v-card class="admin-card" elevation="10">
                    <v-card-title class="admin-session__title">
                        <div>
                            <div class="text-caption">{{ t('admin.activeSession') }}</div>
                            <div class="text-h5">{{ snapshot?.label || activeSessionLabel || activeSessionCode }}</div>
                        </div>
                        <v-chip color="primary" size="small" variant="flat">
                            {{ activeSessionCode }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <div class="admin-session__metrics">
                            <v-chip color="blue" variant="tonal">
                                {{ t('common.participants') }}: {{ sessionMetrics.participantsCount || 0 }}
                            </v-chip>
                            <v-chip color="green" variant="tonal">
                                {{ t('common.commands') }}: {{ sessionMetrics.commandsCount || 0 }}
                            </v-chip>
                            <v-chip color="red" variant="tonal">
                                {{ t('common.errors') }}: {{ sessionMetrics.errorsCount || 0 }}
                            </v-chip>
                            <v-chip color="amber" variant="tonal">
                                {{ t('admin.completed') }}: {{ sessionMetrics.completedCount || 0 }}
                            </v-chip>
                            <v-chip color="cyan-darken-1" variant="tonal">
                                {{ t('admin.averageGap', { value: formatDurationMs(sessionMetrics.averageGapMs) }) }}
                            </v-chip>
                            <v-chip color="teal-darken-1" variant="tonal">
                                {{ t('admin.averageParticipantGap', { value: formatDurationMs(sessionMetrics.averageParticipantGapMs) }) }}
                            </v-chip>
                            <v-chip color="deep-purple-accent-2" variant="tonal">
                                {{ t('admin.averageRate', { value: sessionMetrics.commandsPerMinute ?? '-' }) }}
                            </v-chip>
                        </div>

                        <div class="admin-session__actions">
                            <v-btn size="small" variant="outlined" @click="copySessionCode">
                                {{ t('admin.copyCode') }}
                            </v-btn>
                            <v-btn size="small" variant="outlined" @click="refreshSnapshot">
                                {{ t('common.refresh') }}
                            </v-btn>
                            <v-btn size="small" color="error" variant="outlined" @click="closeActiveSession">
                                {{ t('admin.closeSession') }}
                            </v-btn>
                            <v-btn size="small" variant="text" @click="clearAdminContext">
                                {{ t('admin.hideSession') }}
                            </v-btn>
                        </div>

                        <v-alert
                            v-if="actionInfo"
                            type="success"
                            density="compact"
                            class="mt-4"
                        >
                            {{ actionInfo }}
                        </v-alert>

                        <v-table class="mt-6 admin-session__table">
                            <thead>
                                <tr>
                                    <th>{{ t('common.participant') }}</th>
                                    <th>{{ t('common.commands') }}</th>
                                    <th>{{ t('common.errors') }}</th>
                                    <th>{{ t('admin.step') }}</th>
                                    <th>{{ t('admin.averageGapLabel') }}</th>
                                    <th>{{ t('admin.lastGap') }}</th>
                                    <th>{{ t('admin.path') }}</th>
                                    <th>{{ t('admin.lastActivity') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="participant in participants" :key="participant.id">
                                    <td>
                                        <div class="font-weight-medium">{{ participant.nickname }}</div>
                                        <div class="text-caption">
                                            {{ participant.email || t('admin.emailMissing') }}
                                        </div>
                                        <div class="text-caption">
                                            {{ participant.completed ? t('admin.tutorialCompleted') : t('admin.inProgress') }}
                                        </div>
                                        <div
                                            v-if="participant.completedAtCommand"
                                            class="text-caption text-medium-emphasis"
                                        >
                                            {{ t('admin.completedAtCommand', { command: participant.completedAtCommand, index: participant.completedAtCommandIndex || '-' }) }}
                                        </div>
                                    </td>
                                    <td>{{ participant.commandsCount }}</td>
                                    <td>{{ participant.errorsCount }}</td>
                                    <td>{{ formatStep(participant) }}</td>
                                    <td>{{ formatDurationMs(participant.analytics?.averageGapMs) }}</td>
                                    <td>{{ formatDurationMs(participant.analytics?.lastGapMs) }}</td>
                                    <td>{{ participant.lastKnownPath || '/' }}</td>
                                    <td>{{ formatDate(participant.lastActivityAt) }}</td>
                                </tr>
                                <tr v-if="participants.length === 0">
                                    <td colspan="8" class="text-center text-medium-emphasis">
                                        {{ t('admin.noParticipants') }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked && activeSessionCode && activeAdminToken" justify="center" class="mt-2">
            <v-col cols="12" lg="10">
                <v-card class="admin-card" elevation="8">
                    <v-card-title class="admin-session__title">
                        <div>
                            <div>{{ t('admin.teachingSignals') }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ t('admin.teachingSignalsCaption') }}
                            </div>
                        </div>
                    </v-card-title>
                    <v-card-text>
                        <div class="teaching-signals">
                            <section class="teaching-signals__panel">
                                <div class="teaching-signals__heading">
                                    <v-icon size="18">mdi-account-alert-outline</v-icon>
                                    {{ t('admin.participantsToHelp') }}
                                </div>
                                <div
                                    v-for="participant in participantsToHelp"
                                    :key="participant.id"
                                    class="teaching-signals__row"
                                >
                                    <div>
                                        <div class="font-weight-medium">{{ participant.nickname }}</div>
                                        <div class="text-caption text-medium-emphasis">
                                            {{ t('admin.participantHelpLine', { errors: participant.errorsCount || 0, commands: participant.commandsCount || 0 }) }}
                                        </div>
                                    </div>
                                    <v-chip size="x-small" color="amber" variant="tonal">
                                        {{ t('admin.participantStuckLine', { step: formatStep(participant) }) }}
                                    </v-chip>
                                </div>
                                <div v-if="participantsToHelp.length === 0" class="text-medium-emphasis text-body-2">
                                    {{ t('admin.noTeachingSignals') }}
                                </div>
                            </section>

                            <section class="teaching-signals__panel">
                                <div class="teaching-signals__heading">
                                    <v-icon size="18">mdi-alert-circle-outline</v-icon>
                                    {{ t('admin.commonMistakes') }}
                                </div>
                                <div
                                    v-for="issue in recurringCommandIssues"
                                    :key="issue.command"
                                    class="teaching-signals__row"
                                >
                                    <code>{{ issue.command }}</code>
                                    <v-chip size="x-small" color="red" variant="tonal">
                                        {{ t('admin.issueCount', { count: issue.count }) }}
                                    </v-chip>
                                </div>
                                <div v-if="recurringCommandIssues.length === 0" class="text-medium-emphasis text-body-2">
                                    {{ t('admin.noTeachingSignals') }}
                                </div>
                            </section>

                            <section class="teaching-signals__panel">
                                <div class="teaching-signals__heading">
                                    <v-icon size="18">mdi-map-marker-alert-outline</v-icon>
                                    {{ t('admin.stepBottlenecks') }}
                                </div>
                                <div
                                    v-for="step in stepBottlenecks"
                                    :key="step.label"
                                    class="teaching-signals__row"
                                >
                                    <span>{{ step.label }}</span>
                                    <v-chip size="x-small" color="blue" variant="tonal">
                                        {{ t('admin.issueCount', { count: step.count }) }}
                                    </v-chip>
                                </div>
                                <div v-if="stepBottlenecks.length === 0" class="text-medium-emphasis text-body-2">
                                    {{ t('admin.noTeachingSignals') }}
                                </div>
                            </section>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked && activeSessionCode && activeAdminToken" justify="center" class="mt-2">
            <v-col cols="12" lg="10">
                <v-card class="admin-card" elevation="8">
                    <v-card-title>{{ t('admin.commandRate') }}</v-card-title>
                    <v-card-text>
                        <div v-if="timeline.length" class="timeline-bars">
                            <div v-for="bucket in timeline" :key="bucket.bucketStart" class="timeline-bars__row">
                                <div class="timeline-bars__meta">
                                    {{ formatDate(bucket.bucketStart) }}
                                </div>
                                <div class="timeline-bars__track">
                                    <div
                                        class="timeline-bars__fill"
                                        :style="{ width: `${getTimelineWidth(bucket)}%` }"
                                    ></div>
                                </div>
                                <div class="timeline-bars__value">
                                    {{ t('admin.commandCount', { count: bucket.count }) }}
                                    ({{ bucket.successCount }}/{{ bucket.warningCount }}/{{ bucket.errorCount }})
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-medium-emphasis">
                            {{ t('admin.noTimeline') }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="adminUnlocked && activeSessionCode && activeAdminToken" justify="center" class="mt-2">
            <v-col cols="12" lg="10">
                <v-card class="admin-card" elevation="8">
                    <v-card-title class="admin-session__title">
                        <div>
                            <div>{{ t('admin.commandHistory') }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ t('admin.commandHistoryCaption') }}
                            </div>
                        </div>
                        <div class="history-toolbar">
                            <v-text-field
                                v-model="historySearch"
                                :label="t('admin.searchParticipant')"
                                variant="outlined"
                                density="compact"
                                hide-details
                                clearable
                                prepend-inner-icon="mdi-magnify"
                                class="history-toolbar__search"
                            />
                        </div>
                    </v-card-title>
                    <v-card-text class="history-card__content">
                        <div class="history-table-scroll">
                        <v-table class="admin-session__table admin-session__table--history">
                            <thead>
                                <tr>
                                    <th>
                                        <button class="history-sort-button" type="button" @click="setHistorySort('createdAt')">
                                            {{ t('admin.time') }}
                                            <v-icon size="16">{{ getSortIcon('createdAt') }}</v-icon>
                                        </button>
                                    </th>
                                    <th>
                                        <button class="history-sort-button" type="button" @click="setHistorySort('participantName')">
                                            {{ t('common.participant') }}
                                            <v-icon size="16">{{ getSortIcon('participantName') }}</v-icon>
                                        </button>
                                    </th>
                                    <th>{{ t('admin.command') }}</th>
                                    <th>
                                        <button class="history-sort-button" type="button" @click="setHistorySort('state')">
                                            {{ t('common.status') }}
                                            <v-icon size="16">{{ getSortIcon('state') }}</v-icon>
                                        </button>
                                    </th>
                                    <th>{{ t('admin.sincePrevious') }}</th>
                                    <th>{{ t('admin.sinceParticipantPrevious') }}</th>
                                    <th>{{ t('admin.path') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in filteredCommandHistory" :key="entry.id">
                                    <td>{{ formatDate(entry.createdAt) }}</td>
                                    <td>{{ entry.participantName }}</td>
                                    <td><code>{{ entry.command || t('admin.emptyCommand') }}</code></td>
                                    <td>
                                        <v-chip
                                            size="small"
                                            :color="getStateColor(entry.state)"
                                            variant="tonal"
                                        >
                                            {{ formatState(entry.state) }}
                                        </v-chip>
                                    </td>
                                    <td>{{ formatDurationMs(entry.gapFromPreviousMs) }}</td>
                                    <td>{{ formatDurationMs(entry.gapFromPreviousParticipantMs) }}</td>
                                    <td>{{ entry.path || '/' }}</td>
                                </tr>
                                <tr v-if="filteredCommandHistory.length === 0">
                                    <td colspan="7" class="text-center text-medium-emphasis">
                                        {{ t('admin.noHistoryMatch') }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { useStore } from 'vuex';

    import { currentLocale, t } from '../i18n';
    import { sessionClient } from '../services/sessionClient';

    const POLLING_INTERVAL_MS = 3000;

    const store = useStore();

    const newSessionLabel = ref('');
    const manualSessionCode = ref(store.state.sessionContext?.sessionCode || '');
    const manualAdminToken = ref(store.state.sessionContext?.adminToken || '');
    const adminPassword = ref('');
    const adminUnlocked = ref(false);

    const accessLoading = ref(false);
    const accessError = ref('');
    const createLoading = ref(false);
    const loadLoading = ref(false);
    const createError = ref('');
    const loadError = ref('');
    const actionInfo = ref('');
    const snapshot = ref(null);
    const sessionsList = ref([]);
    const historySearch = ref('');
    const historySortField = ref('createdAt');
    const historySortDirection = ref('desc');
    let pollingTimer = null;

    const activeSessionCode = computed(() => store.state.sessionContext?.sessionCode || '');
    const activeSessionLabel = computed(() => store.state.sessionContext?.sessionLabel || '');
    const activeAdminToken = computed(() => store.state.sessionContext?.adminToken || '');
    const participants = computed(() => snapshot.value?.participants || []);
    const sessionMetrics = computed(() => snapshot.value?.metrics || {});
    const timeline = computed(() => snapshot.value?.timeline || []);
    const commandHistory = computed(() => [...(snapshot.value?.commandHistory || [])].reverse());
    const filteredCommandHistory = computed(() => {
        const normalizedSearch = historySearch.value.trim().toLowerCase();
        const entries = (snapshot.value?.commandHistory || []).filter((entry) => {
            if (!normalizedSearch) {
                return true;
            }
            return (entry.participantName || '').toLowerCase().includes(normalizedSearch);
        });

        const sorted = [...entries].sort((left, right) => {
            const directionFactor = historySortDirection.value === 'asc' ? 1 : -1;
            const field = historySortField.value;

            if (field === 'participantName') {
                return directionFactor * (left.participantName || '').localeCompare(right.participantName || '');
            }

            if (field === 'state') {
                return directionFactor * (left.state || '').localeCompare(right.state || '');
            }

            const leftTime = Date.parse(left.createdAt || '');
            const rightTime = Date.parse(right.createdAt || '');
            const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;
            const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;
            return directionFactor * (safeLeftTime - safeRightTime);
        });

        return sorted;
    });
    const participantsToHelp = computed(() => {
        return [...participants.value]
            .filter((participant) => !participant.completed || (participant.errorsCount || 0) > 0)
            .map((participant) => ({
                ...participant,
                helpScore: (participant.errorsCount || 0) * 3
                    + (!participant.completed ? 1 : 0)
                    + (participant.analytics?.lastGapMs && participant.analytics.lastGapMs > 120000 ? 1 : 0),
            }))
            .sort((left, right) => right.helpScore - left.helpScore)
            .slice(0, 5);
    });
    const recurringCommandIssues = computed(() => {
        const counts = new Map();
        (snapshot.value?.commandHistory || []).forEach((entry) => {
            if (!['error', 'warning'].includes(entry.state)) {
                return;
            }
            const command = (entry.command || '').trim().split(/\s+/)[0] || t('admin.emptyCommand');
            counts.set(command, (counts.get(command) || 0) + 1);
        });

        return [...counts.entries()]
            .map(([command, count]) => ({ command, count }))
            .sort((left, right) => right.count - left.count || left.command.localeCompare(right.command))
            .slice(0, 5);
    });
    const stepBottlenecks = computed(() => {
        const counts = new Map();
        participants.value.forEach((participant) => {
            if (participant.completed) {
                return;
            }
            const label = participant.currentStepId
                || (participant.currentStep ? t('admin.formatStepNumber', { step: participant.currentStep }) : t('admin.unknownStep'));
            counts.set(label, (counts.get(label) || 0) + 1);
        });

        return [...counts.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
            .slice(0, 5);
    });
    const maxTimelineCount = computed(() => {
        if (!timeline.value.length) {
            return 1;
        }
        return Math.max(...timeline.value.map((bucket) => bucket.count || 0), 1);
    });

    const stopPolling = () => {
        if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
        }
    };

    const startPolling = () => {
        stopPolling();
        if (!adminUnlocked.value) {
            return;
        }
        pollingTimer = setInterval(() => {
            refreshSessionsList({ silent: true });
            refreshSnapshot({ silent: true });
        }, POLLING_INTERVAL_MS);
    };

    const applyAdminContext = (sessionCode, sessionLabel, adminToken) => {
        store.commit('setSessionAdmin', {
            sessionCode,
            sessionLabel,
            adminToken,
        });
        manualSessionCode.value = sessionCode;
        manualAdminToken.value = adminToken;
    };

    const unlockAdminAccess = async () => {
        accessLoading.value = true;
        accessError.value = '';

        try {
            await sessionClient.verifyAdminAccess(adminPassword.value.trim());
            adminUnlocked.value = true;
            await refreshSessionsList();

            if (activeSessionCode.value && activeAdminToken.value) {
                await refreshSnapshot();
            }
            startPolling();
        } catch (error) {
            adminUnlocked.value = false;
            accessError.value = error?.message || t('admin.invalidPassword');
        } finally {
            accessLoading.value = false;
        }
    };

    const lockAdminAccess = () => {
        stopPolling();
        adminUnlocked.value = false;
        adminPassword.value = '';
        accessError.value = '';
        sessionsList.value = [];
    };

    const refreshSessionsList = async ({ silent = false } = {}) => {
        if (!adminUnlocked.value) {
            return;
        }

        if (!silent) {
            loadLoading.value = true;
        }

        try {
            const response = await sessionClient.getAdminSessions(adminPassword.value.trim());
            sessionsList.value = response?.sessions || [];
        } catch (error) {
            loadError.value = error?.message || t('admin.sessionsLoadFailed');
        } finally {
            if (!silent) {
                loadLoading.value = false;
            }
        }
    };

    const refreshSnapshot = async ({ silent = false } = {}) => {
        if (!adminUnlocked.value || !activeSessionCode.value || !activeAdminToken.value) {
          return;
        }

        if (!silent) {
          loadLoading.value = true;
        }
        loadError.value = '';

        try {
            const response = await sessionClient.getAdminSessionSnapshot(
                activeSessionCode.value,
                activeAdminToken.value,
                adminPassword.value.trim(),
            );
            snapshot.value = response?.session || null;
        } catch (error) {
            loadError.value = error?.message || t('admin.sessionLoadFailed');
        } finally {
            if (!silent) {
                loadLoading.value = false;
            }
        }
    };

    const createSession = async () => {
        createLoading.value = true;
        createError.value = '';
        actionInfo.value = '';

        try {
            const response = await sessionClient.createSession(
                newSessionLabel.value.trim(),
                adminPassword.value.trim(),
            );
            applyAdminContext(
                response?.session?.code || '',
                response?.session?.label || newSessionLabel.value.trim(),
                response?.admin?.token || '',
            );
            snapshot.value = response?.session || null;
            actionInfo.value = t('admin.sessionCreated');
            await refreshSessionsList({ silent: true });
            await refreshSnapshot();
            startPolling();
        } catch (error) {
            createError.value = error?.message || t('admin.createFailed');
        } finally {
            createLoading.value = false;
        }
    };

    const connectToExistingSession = async () => {
        loadLoading.value = true;
        loadError.value = '';
        actionInfo.value = '';

        try {
            const sessionCode = manualSessionCode.value.trim().toUpperCase();
            const adminToken = manualAdminToken.value.trim();
            const response = await sessionClient.getAdminSessionSnapshot(
                sessionCode,
                adminToken,
                adminPassword.value.trim(),
            );
            applyAdminContext(
                response?.session?.code || sessionCode,
                response?.session?.label || '',
                adminToken,
            );
            snapshot.value = response?.session || null;
            await refreshSessionsList({ silent: true });
            startPolling();
        } catch (error) {
            loadError.value = error?.message || t('admin.existingSessionLoadFailed');
        } finally {
            loadLoading.value = false;
        }
    };

    const closeActiveSession = async () => {
        if (!activeSessionCode.value || !activeAdminToken.value) {
            return;
        }

        loadLoading.value = true;
        loadError.value = '';

        try {
            const response = await sessionClient.closeSession(
                activeSessionCode.value,
                activeAdminToken.value,
                adminPassword.value.trim(),
            );
            snapshot.value = response?.session || null;
            actionInfo.value = t('admin.sessionClosed');
            await refreshSessionsList({ silent: true });
            stopPolling();
            startPolling();
        } catch (error) {
            loadError.value = error?.message || t('admin.closeFailed');
        } finally {
            loadLoading.value = false;
        }
    };

    const openSessionFromList = async (sessionItem) => {
        if (!sessionItem?.code) {
            return;
        }

        manualSessionCode.value = sessionItem.code;
        manualAdminToken.value = '';
        actionInfo.value = t('admin.codeReady', { code: sessionItem.code });
    };

    const clearAdminContext = () => {
        stopPolling();
        snapshot.value = null;
        actionInfo.value = '';
        loadError.value = '';
        store.commit('clearSessionContext');
        manualSessionCode.value = '';
        manualAdminToken.value = '';
    };

    const copySessionCode = async () => {
        if (!activeSessionCode.value || !navigator?.clipboard?.writeText) {
            return;
        }

        await navigator.clipboard.writeText(activeSessionCode.value);
        actionInfo.value = t('admin.codeCopied', { code: activeSessionCode.value });
    };

    const formatDate = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        const locale = currentLocale.value === 'fr' ? 'fr-FR' : 'en-US';
        return date.toLocaleString(locale);
    };

    const formatStep = (participant) => {
        if (participant.completed) {
            return t('admin.formatStepCompleted');
        }
        if (participant.currentStepId) {
            return participant.currentStepId;
        }
        if (participant.currentStep) {
            return t('admin.formatStepNumber', { step: participant.currentStep });
        }
        return '-';
    };

    const formatState = (state) => {
        const key = `admin.states.${state}`;
        const label = t(key);
        return label === key ? state : label;
    };

    const formatDurationMs = (value) => {
        if (!Number.isFinite(value)) {
            return '-';
        }
        if (value < 1000) {
            return `${value} ms`;
        }
        if (value < 60000) {
            return `${(value / 1000).toFixed(1)} s`;
        }
        return `${(value / 60000).toFixed(1)} min`;
    };

    const getTimelineWidth = (bucket) => {
        const count = bucket?.count || 0;
        return Math.max(8, Math.round((count / maxTimelineCount.value) * 100));
    };

    const getStateColor = (state) => {
        if (state === 'error') {
            return 'red';
        }
        if (state === 'warning') {
            return 'amber';
        }
        return 'green';
    };

    const setHistorySort = (field) => {
        if (historySortField.value === field) {
            historySortDirection.value = historySortDirection.value === 'asc' ? 'desc' : 'asc';
            return;
        }

        historySortField.value = field;
        historySortDirection.value = field === 'createdAt' ? 'desc' : 'asc';
    };

    const getSortIcon = (field) => {
        if (historySortField.value !== field) {
            return 'mdi-unfold-more-horizontal';
        }
        return historySortDirection.value === 'asc'
            ? 'mdi-arrow-up'
            : 'mdi-arrow-down';
    };

    onMounted(async () => {
        if (!activeSessionCode.value || !activeAdminToken.value) {
            return;
        }
    });

    onBeforeUnmount(() => {
        stopPolling();
    });
</script>

<style scoped lang="scss">
    .admin-dashboard {
        min-height: calc(100vh - 90px);
        padding-top: 32px;
        padding-bottom: 32px;
    }

    .admin-dashboard__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: end;
        margin-bottom: 12px;
    }

    .admin-dashboard__header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .admin-dashboard__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.75rem;
        color: #5e6d77;
        margin-bottom: 8px;
    }

    .admin-dashboard__title {
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1;
        color: #092737;
        margin-bottom: 12px;
    }

    .admin-dashboard__subtitle {
        color: #4e6673;
    }

    .admin-card {
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(239, 247, 251, 0.99));
    }

    .admin-card__actions {
        padding: 0 16px 16px;
    }

    .admin-session__title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .admin-session__metrics {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .admin-session__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
    }

    .teaching-signals {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
    }

    .teaching-signals__panel {
        min-width: 0;
        border: 1px solid rgba(69, 90, 100, 0.16);
        border-radius: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.56);
    }

    .teaching-signals__heading {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        color: #173847;
        font-weight: 700;
    }

    .teaching-signals__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0;
        border-top: 1px solid rgba(69, 90, 100, 0.1);
    }

    .teaching-signals__row:first-of-type {
        border-top: 0;
    }

    .admin-session__table {
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(69, 90, 100, 0.16);
    }

    .history-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: min(100%, 320px);
    }

    .history-toolbar__search {
        width: 100%;
    }

    .history-card__content {
        padding-top: 8px;
    }

    .history-table-scroll {
        max-height: 520px;
        overflow: auto;
        border-radius: 16px;
    }

    .admin-session__table--history {
        min-width: 860px;
    }

    .admin-session__table--history thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: rgb(239, 247, 251);
    }

    .history-sort-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        background: transparent;
        color: #173847;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
    }

    .timeline-bars {
        display: grid;
        gap: 12px;
    }

    .timeline-bars__row {
        display: grid;
        grid-template-columns: minmax(140px, 220px) 1fr minmax(120px, 170px);
        gap: 12px;
        align-items: center;
    }

    .timeline-bars__meta,
    .timeline-bars__value {
        font-size: 0.82rem;
        color: #435a67;
    }

    .timeline-bars__track {
        height: 12px;
        border-radius: 999px;
        background: rgba(76, 97, 109, 0.16);
        overflow: hidden;
    }

    .timeline-bars__fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #25a8c6, #0f6d86);
    }

    @media (max-width: 960px) {
        .admin-dashboard__header {
            flex-direction: column;
            align-items: flex-start;
        }

        .history-toolbar {
            width: 100%;
        }

        .timeline-bars__row {
            grid-template-columns: 1fr;
        }

        .teaching-signals {
            grid-template-columns: 1fr;
        }
    }
</style>
