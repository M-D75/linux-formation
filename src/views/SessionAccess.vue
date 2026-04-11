<template>
    <v-container class="session-access">
        <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
                <div class="session-access__hero">
                    <div>
                        <div class="session-access__eyebrow">linux-formation</div>
                        <h1 class="session-access__title">Choisir un mode d'utilisation</h1>
                        <p class="session-access__subtitle">
                            Entraine-toi librement ou rejoins une session suivie par un formateur.
                        </p>
                    </div>
                    <v-chip color="blue-grey-darken-3" variant="flat">
                        Connexion: {{ serverBaseUrl }}
                    </v-chip>
                </div>
            </v-col>
        </v-row>

        <v-row justify="center" class="mt-2">
            <v-col cols="12" md="5" lg="4">
                <v-card class="session-card" elevation="8">
                    <v-card-title>Utilisation libre</v-card-title>
                    <v-card-text>
                        <p class="text-body-2">
                            Tu progresses a ton rythme, sans suivi externe.
                        </p>
                        <div class="text-caption session-card__meta">
                            Mode actuel: {{ currentModeLabel }}
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="primary" block @click="startOffline">
                            Ouvrir la plateforme
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" md="5" lg="4">
                <v-card class="session-card" elevation="8">
                    <v-card-title>Rejoindre une session</v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="sessionCode"
                            label="Code de session"
                            variant="outlined"
                            maxlength="6"
                            placeholder="ABC123"
                            required
                            class="mb-3"
                        />
                        <v-text-field
                            v-model="firstName"
                            label="Prenom"
                            variant="outlined"
                            maxlength="40"
                            placeholder="Alice"
                            autocomplete="given-name"
                            required
                            class="mb-3"
                        />
                        <v-text-field
                            v-model="lastName"
                            label="Nom"
                            variant="outlined"
                            maxlength="60"
                            placeholder="Dupont"
                            autocomplete="family-name"
                            required
                            class="mb-3"
                        />
                        <v-text-field
                            v-model="email"
                            label="Mail"
                            variant="outlined"
                            type="email"
                            maxlength="120"
                            placeholder="alice.dupont@example.com"
                            autocomplete="email"
                            required
                        />
                        <v-alert
                            v-if="joinError"
                            type="error"
                            density="compact"
                            class="mt-4"
                        >
                            {{ joinError }}
                        </v-alert>
                    </v-card-text>
                    <v-card-actions class="session-card__actions">
                        <v-btn
                            color="primary"
                            :loading="joinLoading"
                            block
                            @click="joinSession"
                        >
                            Rejoindre
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

    </v-container>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useStore } from 'vuex';

    import { getSessionServerBaseUrl, sessionClient } from '../services/sessionClient';

    const router = useRouter();
    const route = useRoute();
    const store = useStore();

    const sessionCode = ref(
        typeof route.query.code === 'string' ? route.query.code.toUpperCase() : '',
    );
    const firstName = ref(store.state.sessionContext?.participantFirstName || '');
    const lastName = ref(store.state.sessionContext?.participantLastName || '');
    const email = ref(store.state.sessionContext?.participantEmail || '');
    const joinLoading = ref(false);
    const joinError = ref('');
    const serverBaseUrl = getSessionServerBaseUrl();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const currentModeLabel = computed(() => {
        const mode = store.state.sessionContext?.mode || 'offline';
        if (mode === 'participant') {
            return 'session en cours';
        }
        if (mode === 'admin') {
            return 'administration';
        }
        return 'utilisation libre';
    });

    const startOffline = () => {
        store.commit('clearSessionContext');
        router.push({ name: 'home' });
    };

    const joinSession = async () => {
        joinLoading.value = true;
        joinError.value = '';

        try {
            const code = sessionCode.value.trim().toUpperCase();
            const participant = {
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                email: email.value.trim().toLowerCase(),
            };

            if (!code) {
                throw new Error('Le code de session est requis.');
            }
            if (!participant.firstName) {
                throw new Error('Le prenom est requis.');
            }
            if (!participant.lastName) {
                throw new Error('Le nom est requis.');
            }
            if (!participant.email) {
                throw new Error('Le mail est requis.');
            }
            if (!emailPattern.test(participant.email)) {
                throw new Error('Le format du mail est invalide.');
            }

            const result = await sessionClient.joinSession(code, participant);
            const participantName = result?.participant?.displayName
                || [participant.firstName, participant.lastName].filter(Boolean).join(' ');

            store.commit('setSessionParticipant', {
                sessionCode: result?.session?.code || code,
                sessionLabel: result?.session?.label || '',
                participantId: result?.participant?.id || '',
                participantName,
                participantFirstName: result?.participant?.firstName || participant.firstName,
                participantLastName: result?.participant?.lastName || participant.lastName,
                participantEmail: result?.participant?.email || participant.email,
                participantToken: result?.participant?.token || '',
            });

            router.push({ name: 'home' });
        } catch (error) {
            joinError.value = error?.message || 'Impossible de rejoindre la session.';
        } finally {
            joinLoading.value = false;
        }
    };
</script>

<style scoped lang="scss">
    .session-access {
        min-height: calc(100vh - 90px);
        padding-top: 32px;
        padding-bottom: 32px;
    }

    .session-access__hero {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        margin-bottom: 12px;
    }

    .session-access__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.76rem;
        color: #5c6f7b;
        margin-bottom: 8px;
    }

    .session-access__title {
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1;
        margin-bottom: 12px;
        color: #0a2532;
    }

    .session-access__subtitle {
        max-width: 760px;
        color: #48606c;
    }

    .session-card {
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 247, 250, 0.98));
    }

    .session-card__actions {
        padding: 0 16px 16px;
    }

    .session-card__meta {
        color: #607d8b;
    }
    @media (max-width: 960px) {
        .session-access__hero {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
