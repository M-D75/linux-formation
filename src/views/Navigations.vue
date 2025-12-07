<template>
    <v-container>
        <div
            class="floating-robot"
            @mouseenter="handleRobotHover"
            @mouseleave="handleRobotLeave"
            @click.stop="toggleRobotSound"
        >
            <img
                :src="robotImage"
                alt="Assistant robot"
                :class="['robot-sprite', { 'robot-jump': robotJumping, 'robot-flicker': robotFlicker }]"
            />
            <div
                v-if="robotTooltip.visible"
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
                    Briefing de mission
                </v-card-title>
                <v-card-text class="mission-intro">
                    <p class="text-body-2">
                        👋 Padawan du Shell, te voilà enfin !<br>
                        L’ordinateur d'entraînement a dormi 17 cycles... mais ta venue l’a réveillé.<br><br>

                        J’ai besoin d’un pilote. D’un vrai.<br>
                        D’un humain qui sait taper plus vite que son ombre.
                    </p>
                    <br>
                    <p class="text-body-2">
                        🎯 <span class="font-weight-bold text-subtitle-1">Objectif</span> :
                        <br>
                        Explorer un vieux système Linux abandonné
                        et réactiver 5 modules sacrés :
                          <br> - <span class="font-weight-medium">Observation</span> : Te situer dans l'arborescence <v-chip label size="x-small" color="blue" style="margin: 0;"><code>pwd</code></v-chip>
                          <br> - <span class="font-weight-medium">Exploration | Déplacement</span> : Explorer les environs <v-chip label size="x-small" color="blue" style="margin: 0;"><code>ls|cd</code></v-chip>
                          <br> - <span class="font-weight-medium">Nettoyage</span> : Nettoyer l'antique dossier <strong>archives</strong> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>rm</code></v-chip>
                          <br> - <span class="font-weight-medium">Restauration</span> : Monter l'opération <strong>mission/briefing.txt</strong> <v-chip label size="x-small" color="blue" style="margin: 0;"><code>touch</code></v-chip>
                    </p>
                    <br>
                    <p class="text-body-2">
                        🤔 Tu veux un copilote baptisé <span class="font-weight-bold">"Tutoriel"</span> ou tu fonces en solo ?
                    </p>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn variant="text" color="secondary" @click="skipTutorial">
                        Passer
                    </v-btn>
                    <v-btn color="primary" @click="beginTutorial">
                        Lancer le tutoriel
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
                    {{ nanoEditor.filePath ? `Édition - ${nanoEditor.filePath}` : 'Éditeur de fichier' }}
                </v-card-title>
                <v-card-text>

                    <v-textarea
                        v-model="nanoEditor.content"
                        rows="12"
                        auto-grow
                        variant="outlined"
                        label="Contenu du fichier"
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
                        Annuler
                    </v-btn>
                    <v-btn color="primary" @click="saveNanoEditor">
                        Enregistrer
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <div class="badges-actions">
            <v-btn
                class="badge-toggle-btn"
                variant="tonal"
                color="secondary"
                size="small"
                @click="showBadgePanel = !showBadgePanel"
            >
                {{ showBadgePanel ? 'Masquer' : 'Afficher' }} les badges ({{ earnedBadgesCount }}/{{ badges.length }})
            </v-btn>
        </div>
        <!-- Main container for command input and tree visualization -->
        <v-slide-y-transition>
            <div class="command-suggestions global">
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
                                    class="suggestion-chip chip-fade-drop"
                                    @click="selectCommandSuggestion(cmd)"
                                >
                                    <span class="font-weight-bold">{{ cmd }}</span>
                                </v-chip>
                            </template>
                        </v-tooltip>
                    </template>
                </template>

                <template v-else>
                    <v-tooltip
                        v-if="!hasNoCommandMatch"
                        text="Besoin d'aide ? Clique pour lancer help dans le terminal." 
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
                                <v-icon>mdi-help-circle</v-icon>
                            </v-chip>
                        </template>
                    </v-tooltip>

                    <v-tooltip
                        v-if="hasNoCommandMatch"
                        text="Analyse: aucune commande connue ne correspond à ces caractères."
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
                                Attention !
                            </v-chip>
                        </template>
                    </v-tooltip>
                </template>
            </div>
        </v-slide-y-transition>

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
                        label="Entrez une commande (help, cd, ls, mkdir, touch, chmod...)"
                        @focus="dismissCommandHint"
                        @keyup.enter="executeCommand()"
                        @keyup="handleInputKeyup($event)"
                        @keydown.tab.prevent="autoCompleteCommand"
                        placeholder="Par exemple : cd documents"
                    ></v-text-field>
                    <transition name="badge-unlock">
                        <div
                            v-if="showCommandHint"
                            class="command-input-hint"
                            @click="focusCommandInput"
                        >
                            <v-icon class="mr-1" size="18">mdi-lightning-bolt</v-icon>
                            Entrez votre première commande en cliquant ici
                            <span class="hint-arrow">↵</span>
                        </div>
                    </transition>
                </div>

                <v-slide-y-transition>
                    <v-card
                        v-if="tutorial.active && !tutorial.showIntro && !tutorial.completed"
                        class="tutorial-card"
                        variant="text"
                    >
                        <v-card-title class="text-subtitle-1">
                            {{ currentTutorialStep ? currentTutorialStep.title : '' }}
                        </v-card-title>

                        <v-card-text>
                            <div class="tutorial-description" v-html="currentTutorialStep ? currentTutorialStep.description : ''"></div>
                            <div
                                v-if="tutorial.feedback"
                                class="tutorial-feedback"
                                :class="tutorial.feedbackType === 'success' ? 'is-success' : 'is-hint'"
                            >
                                <v-icon
                                    size="18"
                                    class="feedback-icon"
                                    :color="tutorial.feedbackType === 'success' ? 'green-accent-3' : 'amber-accent-3'"
                                >
                                    {{ tutorial.feedbackType === 'success' ? 'mdi-check-circle' : 'mdi-lightbulb-on' }}
                                </v-icon>
                                <span>{{ tutorial.feedback }}</span>
                            </div>
                        </v-card-text>

                        <v-card-actions class="justify-space-between info-step-tutorial">
                            <v-btn variant="text" size="small" @click="skipTutorial">
                                Passer le tutoriel
                            </v-btn>
                            <div class="text-caption">
                                Étape {{ tutorial.currentStep + 1 }} / {{ tutorial.steps.length }}
                            </div>
                        </v-card-actions>
                    </v-card>
                </v-slide-y-transition>

                <v-divider color="success"></v-divider>

                <v-snackbar
                    v-model="tutorial.showSuccess"
                    timeout="4000"
                    location="top"
                    color="primary"
                    variant="tonal"
                >
                    <v-icon>mdi-check</v-icon><span>Mission accomplie ! Tu peux continuer à t'entraîner librement.</span>
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
                        <v-toolbar-title>Badges</v-toolbar-title>
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
                                    Succès débloqué
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
                                Voir
                            </v-btn>
                        </div>
                    </div>
                </transition>

                <!-- Command output section -->
                <v-list 
                    class="output-cmd"
                    ref="outputCmd"
                    base-color="white"
                    bg-color="#333"
                    :height="tutorial.active && !tutorial.showIntro && !tutorial.completed ? 205 : ''"
                >
                    <template
                        v-for="(cmd, index) in commandHistory"
                        :key="index"
                    >
                        <v-tooltip :text="getHistoryTooltip(cmd)" location="bottom">
                            <template #activator="{ props }">
                                <v-list-item v-bind="props">
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
                        </v-tooltip>
                    </template>
                </v-list>
            </div>

            <!-- Tree visualization section -->
            <div id="tree" ref="tree"></div>
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
                    text="Entrez la comande 'pwd' afin de savoir si vous n'êtes pas perdue."
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
                    commande : <span style="font-weight: bold;">chmod</span>
                    <v-tooltip 
                        max-width="250"
                        text="permet de configurer l'accès aux fichiers et aux répertoires"
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

                <h2 style="text-align: center; font-weight: 200;">concernant le {{ chmodInfos.rights.charAt(0) == '-' ? 'fichier' : 'dossier' }} : <span style="font-weight: bold;">{{ chmodInfos.fileName }}</span></h2>
                
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
                            Historique des commandes
                        </v-chip>
                    </div>

                    <div v-else>
                        <template
                            v-for="(cmd, index) in commandHistory.filter((cmd) => cmd.command != '')"
                            :key="index"
                        >
                            <v-tooltip :text="getHistoryTooltip(cmd)" location="top">
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
  
<script>
  import * as d3 from 'd3';
  import $ from 'jquery';
  import { folderTree } from '../data/folderTree';
  
  export default {
    name: 'FolderTree',
    computed: {
        currentTutorialStep() {
            return this.tutorial.steps[this.tutorial.currentStep] || null;
        },
        earnedBadgesCount() {
            return this.badges.filter((badge) => badge.earned).length;
        },
        robotImage() {
            if (this.robotMood === 'default' && this.robotEyesClosed) {
                return this.robotSprites.defaultClosed || this.robotSprites.default;
            }
            return this.robotSprites[this.robotMood] || this.robotSprites.default;
        },
        robotSoundEnabled: {
            get() {
                const value = this.$store.state.robotSoundEnabled;
                return typeof value === 'boolean' ? value : true;
            },
            set(enabled) {
                this.$store.commit('setRobotSoundEnabled', !!enabled);
            },
        },
        commandSuggestions() {
            const term = (this.command || '').trim().split(' ')[0]?.toLowerCase() || '';
            if (!term) {
                return [];
            }
            return this.availableCommands
                .filter((cmd) => cmd.startsWith(term))
                .slice(0, 5);
        },
        availableCommands() {
            return Object.keys(this.commandDescriptions)
                .filter((cmd) => typeof cmd === 'string' && cmd.length > 0);
        },
        hasNoCommandMatch() {
            const raw = (this.command || '').trim().toLowerCase();
            const term = raw.split(' ')[0] || '';
            if (!term) {
                return false;
            }
            return !this.availableCommands.some((cmd) => cmd.startsWith(term));
        },
    },
    watch: {
        command(val) {
            if (val && this.showCommandHint) {
                this.showCommandHint = false;
            }
        },
        showCommandHint(val) {
            if (!this.tutorial.active || this.tutorial.showIntro || this.tutorial.completed) {
                return;
            }
            if (val) {
                this.maybeShowTutorialIntroHint();
            } else {
                this.clearTutorialRobotHint('intro');
                this.maybeShowTutorialHelpHint();
            }
        },
    },
    data() {
        const localTree = JSON.parse(JSON.stringify(folderTree));
        const ensureFileContent = (node) => {
            if (!node || typeof node !== 'object') {
                return;
            }
            if (node.type === 'f' && typeof node.content !== 'string') {
                node.content = '';
            }
            if (Array.isArray(node.children)) {
                node.children.forEach(ensureFileContent);
            }
        };
        ensureFileContent(localTree);

        return {
            root: null,
            pwd: "",
            command: '',
            output: '',
            currentNode: null, // Le dossier courant
            folderTreeData: localTree, // Copie locale de folderTree
            commandHistory: [], // Historique des commandes
            cursorHistory: 0,
            maxFileSizeBytes: 40 * 1024 * 1024,
            cDirect: {
                from: null,
                to: null,
            },
            ls: {
                showHidden: false,
                dirName: ""
            },
            chmodInfos: {
                fileName: "",
                rights: "----------",
                data: {
                    user: [],
                    group: [],
                    other: [],
                }
            },
            currentUser: 'user',
            currentGroups: ['user'],
            tutorial: {
                showIntro: true,
                active: true,
                completed: false,
                showSuccess: false,
                currentStep: 0,
                feedback: '',
                feedbackType: '',
                steps: [
                    {
                        id: 'help',
                        title: '1. Découvre ton arsenal',
                        description: 'Tape <code>help</code> pour afficher toutes les commandes disponibles dans ce poste d’entraînement.',
                        success: 'Tu sais comment obtenir la liste des commandes.'
                    },
                    {
                        id: 'pwd',
                        title: '2. Repérer votre position',
                        description: 'Tape <code>pwd</code> pour afficher le chemin comme <strong>root &gt; home &gt; user</strong>.',
                        success: 'Tu sais maintenant où tu te trouves.'
                    },
                    {
                        id: 'ls',
                        title: '3. Observer les environs',
                        description: 'Exécute <code>ls</code> (optionnellement avec <code>-l</code>) pour voir les dossiers disponibles.',
                        success: 'Cartographie du secteur réalisée.'
                    },
                    {
                        id: 'cd-documents',
                        title: '4. Atteindre le dossier documents',
                        description: 'Utilise <code>cd documents</code> (ou le chemin absolu) pour rejoindre le dossier <strong>documents</strong>.',
                        success: 'Bienvenue dans les documents.'
                    },
                    {
                        id: 'cd-parent',
                        title: '5. Remonter d’un niveau',
                        description: 'Utilise <code>cd ..</code> ou <code>cd ../</code> pour revenir au dossier parent et apprendre à reculer d’un cran.',
                        success: 'La marche arrière est maîtrisée.'
                    },
                    {
                        id: 'cd-documents-return',
                        title: '6. Retourner dans documents',
                        description: 'Reviens maintenant dans <strong>documents</strong> avec <code>cd documents</code> pour poursuivre la mission.',
                        success: 'De retour dans documents, prêt pour la suite.'
                    },
                    {
                        id: 'rm-archives',
                        title: '7. Nettoyer les archives',
                        description: 'Supprime l’ancien dossier <code>archives</code> avec <code>rm -r archives</code>.',
                        success: 'Archives nettoyées avec succès.'
                    },
                    {
                        id: 'mkdir-mission',
                        title: '8. Préparer la mission',
                        description: 'Crée un nouveau dossier <code>mission</code> (ex: <code>mkdir mission</code>) dans <strong>documents</strong>.',
                        success: 'Dossier mission créé.'
                    },
                    {
                        id: 'cd-mission',
                        title: '9. Entrer dans mission',
                        description: 'Déplace-toi dans le dossier <code>mission</code>.',
                        success: 'Mission est maintenant ton dossier courant.'
                    },
                    {
                        id: 'touch-briefing',
                        title: '10. Créer le briefing',
                        description: 'Crée un fichier <code>briefing.txt</code> (ex: <code>touch briefing.txt</code>) dans <strong>mission</strong>.',
                        success: 'Briefing.txt est en place, mission accomplie !'
                    },
                ],
            },
            showCommandHint: true,
            signals: [],
            signalCounter: 0,
            signalTimers: [],
            commandDescriptions: {
                '': 'Information système',
                help: 'Affiche la liste des commandes disponibles.',
                man: 'Consulte la documentation détaillée d\'une commande.',
                pwd: 'Affiche le chemin du répertoire courant.',
                echo: 'Renvoie du texte dans le terminal.',
                cd: 'Change de répertoire.',
                ls: 'Liste le contenu d\'un dossier.',
                ll: 'Alias de ls -l : liste détaillée des fichiers.',
                mkdir: 'Crée un nouveau dossier.',
                touch: 'Crée ou met à jour un fichier.',
                rm: 'Supprime un fichier ou un dossier.',
                chmod: 'Modifie les permissions d\'un fichier ou dossier.',
                cat: 'Affiche le contenu d\'un fichier (supporte la redirection).',
                head: 'Affiche les premières lignes d\'un fichier (option -n).',
                tail: 'Affiche les dernières lignes d\'un fichier (option -n).',
                nano: 'Ouvre un éditeur pop-up pour modifier un fichier.',
            },
            showBadgePanel: false,
            badges: [
                { id: 'explorer', title: 'Explorateur', description: 'Visite 10 répertoires différents.', earned: false, icon: 'mdi-compass' },
                { id: 'architecte', title: 'Architecte', description: 'Crée un dossier et un fichier.', earned: false, icon: 'mdi-home-analytics' },
                { id: 'nettoyeur', title: 'Nettoyeur', description: 'Supprime un dossier avec rm -r.', earned: false, icon: 'mdi-delete-sweep' },
                { id: 'sage', title: 'Sage du shell', description: 'Consulte 3 pages man.', earned: false, icon: 'mdi-book-open-variant' },
                { id: 'mentor', title: 'Mentor', description: 'Termine le tutoriel d’entraînement.', earned: false, icon: 'mdi-school-outline' },
            ],
            stats: {
                visitedPaths: [],
                createdDirectory: false,
                createdFile: false,
                removedDirectory: false,
                manUses: 0,
                tutorialCompleted: false,
            },
            nanoEditor: {
                show: false,
                filePath: '',
                content: '',
                originalContent: '',
                error: '',
            },
            robotMood: 'default',
            robotResetTimer: null,
            robotJumpTimer: null,
            robotSprites: {
                default: '/img/neutral-eyes-open.svg',
                defaultClosed: '/img/neutral-eyes-closed.svg',
                success: '/img/smile-robot.svg',
                warning: '/img/unhappy-robot.svg',
                error: '/img/error-robot.svg',
                loving: '/img/full-love-robot.svg',
            },
            robotJumping: false,
            robotFlicker: false,
            robotFlickerTimer: null,
            robotHovering: false,
            robotEyesClosed: false,
            robotBlinkTimer: null,
            badgeSnackbar: {
                show: false,
                message: '',
                icon: '',
                description: '',
                timeoutId: null,
            },
            audioSources: {
                talk: [],
                warning: [],
                error: [],
                success: [],
                beep: [],
            },
            audioTimers: {
                talk: null,
                warning: null,
                error: null,
                success: null,
                beep: null,
            },
            robotMoodOverride: null,
            robotTooltip: {
                visible: false,
                message: '',
                greetingShown: false,
                lastMessage: '',
                auto: false,
                timer: null,
                type: 'default',
                icon: '',
            },
            robotDialoguePool: [
                'Je t\'observe, courage.',
                'Continue à apprendre, tu te débrouilles bien.',
                'Chaque commande compte, même les petites.',
                'Les archives n\'ont qu\'à bien se tenir.',
                'Un terminal heureux est un terminal utilisé.',
                'La précision est ta meilleure alliée.',
                'Tu vas devenir un maître du shell.',
                'Une étape à la fois, ça avance.',
                'J\'adore quand tu utilises pwd 📍.',
                'Les dossiers tremblent devant toi.',
                'On respire, on tape, on réussit.',
                'Tu as déjà parcouru un long chemin.',
                'Je garde un œil bienveillant sur toi 👀.',
                'Les erreurs sont juste des indices déguisés.',
                'Quel style dans tes commandes !',
                'La mission avance, ne lâche rien.',
                'Tu fais ça comme un(e) pro.',
                'Ton futur toi te dira merci.',
                'Les neurones chauffent, j\'aime ça 🔥.',
                'Linux n\'a qu\'à bien se tenir.',
                'Laisse ta curiosité te guider.',
                'Une pause café ? Non, une commande !',
                'Chaque cd te rapproche de la victoire.',
                'Tu fais danser les répertoires 💃.',
                'Garde le cap, le terminal est avec toi.',
                'La patience est ta superpuissance.',
                'Même les octets te regardent avec respect.',
                'Tu tapes vite, mais tu apprends encore plus vite ⚡.',
                'Ton clavier est ton sabre laser.',
                'Un shell bien dompté, c\'est la liberté.',
                'On dirait que tu connais déjà la voie.',
                'Les permissions t\'obéissent 👑.',
                'Chaque réussite mérite un petit sourire.'
            ],
            robotCommandKeywords: [
                'help', 'pwd', 'ls', 'cd', 'mkdir', 'touch',
                'rm', 'chmod', 'cat', 'head', 'tail', 'nano', 'echo'
            ],
        robotDialogueIconPool: [
            'mdi-robot-excited',
            'mdi-emoticon-happy-outline',
            'mdi-star-face',
            'mdi-flash',
                'mdi-rocket',
                'mdi-owl',
                'mdi-lightbulb-on-outline',
                'mdi-firework',
                'mdi-school-outline',
                'mdi-hand-okay'
            ],
            robotErrorEncouragements: [
                'Courage, tu vas y arriver !',
                'Respire et réessaie calmement.',
                'Les erreurs font aussi partie de l\'apprentissage.',
                'Chaque tentative te rapproche de la solution.',
                'On corrige et on continue.',
                'Un petit ajustement et ça passera.',
                'Ne lâche rien, tu es sur la bonne voie.',
                'Tu peux le faire, j\'en suis sûr.',
                'Analyse, corrige, et fonce.',
                'Même les maîtres du shell se trompent parfois.'
            ],
            treeSvg: null,
            robotSoundToast: {
                visible: false,
                message: '',
                timer: null,
            },
            activeAudios: [],
            talkLoopAudio: null,
            tutorialGuidance: {
                introShown: false,
                helpHintShown: false,
                persistentId: null,
            },
        };
    },
    mounted() {
        this.createTree();
        this.createOutputAnimate()
        this.loadCommandHistory();
        this.loadBadgeState();
        this.loadAudioEffects();
        this.scheduleNeutralBlink();
    },
    beforeUnmount() {
        this.signalTimers.forEach((timer) => clearTimeout(timer));
        this.signalTimers = [];
        if (this.robotResetTimer) {
            clearTimeout(this.robotResetTimer);
            this.robotResetTimer = null;
        }
        if (this.robotJumpTimer) {
            clearTimeout(this.robotJumpTimer);
            this.robotJumpTimer = null;
        }
        if (this.robotFlickerTimer) {
            clearTimeout(this.robotFlickerTimer);
            this.robotFlickerTimer = null;
        }
        this.clearRobotTooltipTimer();
        if (this.robotSoundToast.timer) {
            clearTimeout(this.robotSoundToast.timer);
            this.robotSoundToast.timer = null;
        }
        this.stopAllActiveAudios();
        Object.keys(this.audioTimers).forEach((key) => {
            if (this.audioTimers[key]) {
                clearTimeout(this.audioTimers[key]);
                this.audioTimers[key] = null;
            }
        });
        if (this.badgeSnackbar.timeoutId) {
            clearTimeout(this.badgeSnackbar.timeoutId);
            this.badgeSnackbar.timeoutId = null;
        }
    },
    methods: {
        buildRightsInfos(){
            // 
            const usersR = this.chmodInfos.rights.split("").slice(1, 4);

            // mdi-pen-plus
            // mdi-book-open-outline
            // mdi-robot-excited

            // mdi-pen-remove
            // mdi-notebook-remove
            // mdi-robot-off

            this.chmodInfos.data.user = [{
                            title: "[user] Vous pouvez ", 
                            value: 0, 
                            props: {
                                    prependIcon: 'mdi-account',
                                }
                            }];

            let list = {
                "0": { // not r
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-notebook-remove',
                        color: 'red',
                    }
                },
                "1": {// not w
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-pen-remove',
                        color: 'red',
                    }
                },
                "2": {// not x
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-robot-off',
                        color: 'red',
                    }
                },
                "r": {
                    title: "[r] le lire", 
                    value: 1, 
                    props: {
                        appendIcon: 'mdi-book-open-outline',
                        color: 'blue',
                    }
                },
                "w": {
                    title: "[w] l'écrire", 
                    value: 2, 
                    props: {
                        appendIcon: 'mdi-pen-plus',
                        color: 'blue',
                    }
                },
                "x": {
                    title: "[x] l'éxecuter", 
                    value: 3, 
                    props: {
                        appendIcon: 'mdi-robot-excited',
                        color: 'blue',
                    }
                }
            }

            for (let index = 0; index < usersR.length; index++) {
                const element = usersR[index];

                if(element != '-')
                    this.chmodInfos.data.user.push(list[element])
                else
                    this.chmodInfos.data.user.push(list[index.toString()])
            }

            let binSVal = usersR.map(v => v != '-' ? "1" : "0").reverse().join("")
            this.chmodInfos.data.user.push({title: `${usersR.join('')} = ${binSVal.split('').map((v, i) => (2**i)*parseInt(v)).reverse().join(" + ")} = ${parseInt(binSVal.split("").reverse().join("").toString(), 2).toString()}`})
            
            // 
            list = {
                "0": { // not r
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-notebook-remove',
                        color: 'red',
                    }
                },
                "1": {// not w
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-pen-remove',
                        color: 'red',
                    }
                },
                "2": {// not x
                    title: "[-]",
                    props: {
                        appendIcon: 'mdi-robot-off',
                        color: 'red',
                    }
                },
                "r": {
                    title: "[r] lirent", 
                    value: 1, 
                    props: {
                        appendIcon: 'mdi-book-open-outline',
                        color: 'blue',
                    }
                },
                "w": {
                    title: "[w] écrirent", 
                    value: 2, 
                    props: {
                        appendIcon: 'mdi-pen-plus',
                        color: 'blue',
                    }
                },
                "x": {
                    title: "[x] éxecuter", 
                    value: 3, 
                    props: {
                        appendIcon: 'mdi-robot-excited',
                        color: 'blue',
                    }
                }
            }

            // group
            const groupR = this.chmodInfos.rights.split("").slice(4, 7);

            this.chmodInfos.data.group = [{
                                    title: "[group] les membres du groupe peuvent", 
                                    value: 0, 
                                    props: {
                                        prependIcon: 'mdi-account-group',
                                    }
                                }];

            for (let index = 0; index < groupR.length; index++) {
                const element = groupR[index];
                if(element != '-')
                    this.chmodInfos.data.group.push(list[element])
                else
                    this.chmodInfos.data.group.push(list[index.toString()])
            }

            binSVal = groupR.map(v => v != '-' ? "1" : "0").reverse().join("")
            this.chmodInfos.data.group.push({title: `${groupR.join('')} = ${binSVal.split('').map((v, i) => (2**i)*parseInt(v)).reverse().join(" + ")} = ${parseInt(binSVal.split("").reverse().join("").toString(), 2).toString()}`})

            // others
            const otherR = this.chmodInfos.rights.split("").slice(7, 10);
            this.chmodInfos.data.other = [{
                            title: "[other] Tous les autres peuvent", 
                            value: 0, 
                            props: {
                                    prependIcon: 'mdi-earth',
                                }
                            }];

            for (let index = 0; index < otherR.length; index++) {
                const element = otherR[index];

                if(element != '-')
                    this.chmodInfos.data.other.push(list[element])
                else
                    this.chmodInfos.data.other.push(list[index.toString()])
            }

            binSVal = otherR.map(v => v != '-' ? "1" : "0").reverse().join("")
            this.chmodInfos.data.other.push({title: `${otherR.join('')} = ${binSVal.split('').map((v, i) => (2**i)*parseInt(v)).reverse().join(" + ")} = ${parseInt(binSVal.split("").reverse().join("").toString(), 2).toString()}`})
        },
        focusCommandInput() {
            if (this.$refs.commandInput?.focus) {
                this.$refs.commandInput.focus();
            }
        },
        dismissCommandHint() {
            if (this.showCommandHint) {
                this.showCommandHint = false;
            }
        },
        handleInputKeyup(event) {
            this.dismissCommandHint();
            this.navigateTerminal(event);
        },
        selectCommandSuggestion(cmd) {
            this.command = `${cmd} `;
            this.dismissCommandHint();
            this.$nextTick(() => this.focusCommandInput());
        },
        injectHelpCommand() {
            this.command = 'help ';
            this.dismissCommandHint();
            this.$nextTick(() => this.focusCommandInput());
        },
        refreshTreeView(source = null, options = {}) {
            if (typeof this.updateTree !== 'function') {
                return;
            }
            this.updateTree(source || this.currentNode || this.root);
            if (options.signal !== false) {
                this.emitTreeSignal();
            }
        },
        emitTreeSignal() {
            if (
                !this.$refs.mainPanel ||
                !this.$refs.commandInputWrapper ||
                !this.$refs.tree
            ) {
                return;
            }
            const panelRect = this.$refs.mainPanel.getBoundingClientRect();
            const startRect = this.$refs.commandInputWrapper.getBoundingClientRect();
            const treeTarget = this.$refs.tree.querySelector('svg') || this.$refs.tree;
            if (!startRect || !treeTarget) {
                return;
            }
            const endRect = treeTarget.getBoundingClientRect();
            const startX = startRect.left + startRect.width / 1.2 - panelRect.left;
            const startY = startRect.top - panelRect.top;
            const endX = endRect.left + endRect.width / 2 - panelRect.left;
            const endY = endRect.top + 80 - panelRect.top;

            // const offsets = [-5, 0, 20, 10, 60, 40, 30];
            //randomeize offsets value between -5 and 90
            const offsets = Array.from({ length: 7 }, () => Math.floor(Math.random() * 95) - 5);

            // offsets.sort(() => Math.random() - 0.5);
            offsets.forEach((offset, index) => {
                const id = ++this.signalCounter;
                const style = {
                    left: `${startX}px`,
                    top: `${startY + offset}px`,
                    '--signal-end-x': `${endX - startX}px`,
                    '--signal-end-y': `${endY - startY - offset * 0.2}px`,
                    animationDelay: `${index * 80}ms`,
                };
                this.signals.push({ id, style });
                const timer = setTimeout(() => {
                    this.signals = this.signals.filter((sig) => sig.id !== id);
                }, 850 + index * 40);
                this.signalTimers.push(timer);
            });
        },
        createOutputAnimate(){
            const width = 500;
            const height = 110;

            let i = 0;
            const decalageX = 10;
            const _vue = this;

            d3.select(this.$refs.output_animate).select("svg").remove()
            if(!_vue.cDirect.from)
                return;

            const svg = d3
            .select(this.$refs.output_animate)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-100, -100, width + 100, height + 100])
                .style('overflow', 'visible');
            
            let g = svg.append("g")
                        .attr('transform', (d) => `translate(${width/2},${0})`)

            g.append('text')
                .text("COMMANDE [cd] : CHANGE DIRECTORY")
                .attr('dy', '.35em')
                .attr('dx', '1.7em')
                // .attr('x', width/2)
                .attr("text-anchor", "middle") // Centre horizontalement
                .attr("dominant-baseline", "middle") // Centre verticalement
                // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                .attr('font-size', '17px')
                .style('user-select', 'none');

            g = svg.append("g")
                        .attr('transform', (d) => `translate(${decalageX},${height/2})`)
                    
            g.append('text')
                .text(_vue.cDirect.from)
                .attr('dy', '.15em')
                .attr('dx', '1em')
                // .attr('x', width/2)
                .attr("text-anchor", "middle") // Centre horizontalement
                .attr("dominant-baseline", "middle") // Centre verticalement
                // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                .attr('font-size', '17px')
                .style('user-select', 'none');

            g.append("foreignObject")
                .attr('width', 50)
                .attr('height', 50)
                .attr('x', 0)
                .attr('y', 0)
                .html('<i class="mdi mdi-folder-open-outline mdi-icon-folder" style="font-size: 40px"></i>');

            const numArrows = 5;
            const duration = 2000;

            // Création des flèches dans des `foreignObject`
            const arrows = Array.from({ length: numArrows }, (_, i) => {
                return svg.append("foreignObject")
                    .attr("x", 60)
                    .attr("y", (height/2)-decalageX)
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("opacity", 1)
                    .html('<i class="mdi mdi-chevron-right mdi-icon-folder" style="font-size: 50px"></i>');
                });

            // Fonction pour animer une flèche
            function animateArrow(arrow, index) {
                arrow
                    .attr("x", 60)
                    .attr("opacity", 1)
                        .transition()
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr("x", width-decalageX-50)
                        .attr("opacity", 0)
                            .on("end", () => {
                                animateArrow(arrow, index);
                            });
            }

            // Lancer l'animation pour chaque flèche
            arrows.forEach((arrow, index) =>  setTimeout(() => animateArrow(arrow, index), index * 300));

            g = svg.append("g")
                .attr('transform', (d) => `translate(${width-decalageX}, ${height/2})`)

            g.append('text')
                .text(_vue.cDirect.to)
                .attr('dy', '.15em')
                .attr('dx', '1em')
                // .attr('x', width/2)
                .attr("text-anchor", "middle") // Centre horizontalement
                .attr("dominant-baseline", "middle") // Centre verticalement
                // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                .attr('font-size', '17px')
                .style('user-select', 'none');
            
            g.append("foreignObject")
                .attr('width', 50)
                .attr('height', 50)
                .attr('x', 0)
                .attr('y', 0)
                .html('<i class="mdi mdi-folder-outline mdi-icon-folder" style="font-size: 40px"></i>');
            
        },
        createTree() {
            const width = 1500;
            const height = 800;

            let i = 0;
            let children_initiated = false;

            d3.select(this.$refs.tree).select("svg").remove()

            const svg = d3
            .select(this.$refs.tree)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-100, -100, width + 100, height + 100])
                .style('overflow', 'visible');
            this.treeSvg = svg;
            
            const tooltip = d3.select("body")
            .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
    
            let root = d3.hierarchy(this.folderTreeData);
            this.root = root;
            root.x0 = height / 2;
            root.y0 = 0;
    
            if (!this.currentNode) {
                this.currentNode = root;
                setTimeout(function(){
                    this.changeDirectory("home/user", { silent: true })
                    this.cDirect.from = null;
                    this.createOutputAnimate()
                }.bind(this), 750)
            } 
            else {
                this.currentNode = root;
                setTimeout(function(){
                    this.changeDirectory(this.pwd, { silent: true })
                    // this.cDirect.from = null;
                    // this.createOutputAnimate()
                }.bind(this), 50)
            }

            const update = (source) => {

                if(source.id == this.root.id)
                    i = 0;
                
                const treeLayout = d3.tree().size([height, width - 120]);
                console.log("this.root:", this.root);
                
                treeLayout(this.root);
                const nodes = this.root.descendants();
                const node = svg.selectAll('g.node').data(nodes, (d) => d.id || (d.id = ++i));

                const _vue = this;

                // Supprimer les anciens nœuds
                const nodeExit = node
                .exit()
                    .transition()
                    .duration(500)
                    .attr('transform', (d) => `translate(${source.y},${source.x})`)
                    .remove();
    
                nodeExit.select('circle').attr('r', 0.6);
                nodeExit.select('rect').attr('r', 0.6);
                nodeExit.select('text').style('fill-opacity', 0.6);
    
                // Ajouter de nouveaux nœuds
                const nodeEnter = node
                .enter()
                    .append('g')
                    .attr('class', (d) => d.id == this.currentNode?.id && d?.data?.name == _vue.currentNode?.data?.name && d?.depth == _vue.currentNode?.depth ? 'node current' : 'node')
                    .attr('transform', (d) => `translate(${width+1000},${height/2})`)
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", 1);
                        tooltip.html(d.data.name != 'root' ? d.data.name : '/')
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 10) + "px");
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 10) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.transition().duration(200).style("opacity", 0);
                    })
                    .on('click', (event, d) => {
                        if (d.children) {
                            // d._children = d.children;
                            d.children = null;
                        } 
                        else {
                            d.children = d._children;
                            // d._children = null;
                        }
                        update(d);
                    });

                d3.selectAll("circle.indicator-current")
                    .transition()
                    .duration(500)
                    .attr('transform', 'scale(0)')
                    .remove()
    
                nodeEnter.each(function(d) {
                    // Vérifier la valeur de 'type' pour chaque nœud
                    if (d.data.type == 'd') {// directory
                        d3.select(this)
                            .append('circle')
                            .attr('r', 20)
                            .attr('fill', (d) => (d._children ? 'lightsteelblue' : '#fff'))
                            .attr('stroke', 'steelblue')
                            .attr('stroke-width', 2);
                    } 
                    else{// files
                        d3.select(this)
                            .append('rect')
                            .attr('width', 20)
                            .attr('height', 20)
                            .attr('x', -10) // Pour centrer le carré
                            .attr('y', -10) // Pour centrer le carré
                            .style('fill', 'white')
                            .attr('stroke', 'steelblue')
                            .attr('stroke-width', 3)
                            .style('fill-opacity', 0.3);
                    }
                });
    
                nodeEnter
                    .append('text')
                    .attr('dy', '.35em')
                    .attr('x', (d) => (d.children || d._children ? -25 : 25))
                    .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                    .text((d) => d.data.name)
                    .attr('font-size', '17px')
                    .style('user-select', 'none');

                // mdi mdi-file-chart-outline
                nodeEnter
                    .append("foreignObject")
                    .attr("x", -20)
                    .attr("y", -80)
                    .attr("width", 200)
                    .attr("height", 200)
                    .html(
                        (d) => d.data.type == 'd' ? ((d._children ? '<i class="mdi mdi-folder  mdi-icon-folder" style="font-size: 40px"></i>' : '<i class="mdi mdi-folder-open mdi-icon-folder" style="font-size: 40px"></i>'))  : '<i class="mdi mdi-file-chart-outline mdi-icon-folder" style="font-size: 40px"></i>');

                // Mise à jour des nœuds existants
                const nodeUpdate = nodeEnter.merge(node);
                
                // Transition des nœuds vers leur nouvelle position
                nodeUpdate
                    .transition()
                    .duration(750)
                    .attr('transform', (d) => `translate(${d.y},${d.x})`);

                // Mettre à jour les classes des nœuds pour refléter l'état du dossier courant
                nodeUpdate
                    .attr('class', (d) => d.id == _vue.currentNode?.id ? 'node current' : 'node');
    
                nodeUpdate
                    .select("foreignObject")
                    .attr("class", (d) => d.id == _vue.currentNode?.id ? "fadein" : "")
                    .html(
                        (d) => d.data.type == 'd' ? 
                                ((d?._children ? '<i class="mdi mdi-folder  mdi-icon-folder" style="font-size: 40px"></i>' : (d.data?.children?.length != 0 ? '<i class="mdi mdi-folder-open mdi-icon-folder" style="font-size: 40px"></i>' : '<i class="mdi mdi-folder-hidden mdi-icon-folder" style="font-size: 40px"></i>'))) 
                            : '<i class="mdi mdi-file-chart-outline mdi-icon-folder" style="font-size: 40px"></i>');

                nodeUpdate.each(function(d) {
                    if( _vue.currentNode?.id == d.id && d?.data?.name == _vue.currentNode?.data?.name && d?.depth == _vue.currentNode?.depth ){
                        d3.select(this)
                            .append('circle')
                            .attr("class", "indicator-current")
                            .attr('r', 10)
                            .attr('fill', 'black')
                        
                        d3.select(this)
                            .append('circle')
                            .attr("class", "indicator-current")
                            .attr('r', 5)
                            .attr('fill', 'orange')
                    }
                });

                // Mettre à jour les cercles pour refléter l'état du dossier courant
                nodeUpdate
                    .select('circle')
                    .transition()
                    .duration(750)
                    .attr('fill', (d) => {
                        if (d.id == this.currentNode?.id && d?.data?.name == _vue.currentNode?.data?.name && d?.depth == _vue.currentNode?.depth) {
                            return 'orange';
                        }
                        return d._children ? '#00A5DB' : '#fff';
                    })
                    .attr('stroke-width', (d) => (d.id == _vue.currentNode?.id && d?.data?.name == _vue.currentNode?.data?.name && d?.depth == _vue.currentNode?.depth ? 6 : 4))
                    .attr('stroke', (d) => (d.id == _vue.currentNode?.id ? 'black' : '#232B33'))
                    
                
               
                // Liens entre les nœuds
                const links = this.root.links();

                const link = svg.selectAll('path.link').data(links, (d) => d.target.id);

                
                // Supprimer les anciens liens
                link.exit()
                    // .interrupt()
                    .transition()
                    .duration(750)
                    .attr('d', (d) => {
                        const o = { x: source.x0, y: source.y0 };
                        return diagonal(o, o);
                    })
                    .remove();
    
                // Ajouter de nouveaux liens
                const linkEnter = link.enter()
                    .insert('path', 'g')
                    .attr('class', 'link')
                    .attr('opacity', 1)
                    .attr('d', (d) => {
                        const o = { x: source.x0, y: source.y0 };
                        return diagonal(o, o);
                    })
                    .attr('fill', 'none')
                    .attr('stroke', (d) => _vue.isPathToCurrentNode(d.target) ? (!_vue.pwd || _vue.pwd == "" ? '#986547' : '#5FADAD') : '#ccc')
                    .attr('stroke-width', (d) => _vue.isPathToCurrentNode(d.target) ? 17 : 2)
                    .attr('stroke-dasharray', (d) => _vue.isPathToCurrentNode(d.target) ? '6 9' : '0')

                // Mettre à jour les liens existants
                linkEnter.merge(link)
                    .transition()
                    .duration(750)
                    .attr('d', (d) => diagonal(d.source, d.target))
                    .attr('stroke', (d) => _vue.isPathToCurrentNode(d.target) ? (!_vue.pwd || _vue.pwd == "" ? '#986547' : '#5FADAD') : '#ccc')
                    .attr('stroke-width', (d) => _vue.isPathToCurrentNode(d.target) ? 17 : 2)
                    .attr('stroke-dasharray', (d) => _vue.isPathToCurrentNode(d.target) ? '6 9' : '0')
                    .attr('class', (d) => _vue.isPathToCurrentNode(d.target) ? 'link fadein' : 'link')
                    // .on('end', function repeat(d) {
                    //     if (_vue.isPathToCurrentNode(d.target)) {
                    //         d3.select(this)
                    //             .transition()
                    //             .duration(500)
                    //             .attr('opacity', 0.3)
                    //             .transition()
                    //             .duration(500)
                    //             .attr('opacity', 1)
                    //             .on('end', repeat);
                    //     }
                    // });

                nodes.forEach((d) => {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            };
    
            const diagonal = (s, d) => `

                M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}
            `;
    
            if( !children_initiated ){

                this.root.descendants().forEach((d) => {
                    
                    d._children = d.children;
                    if (d.depth > 0) {
                        d.children = null;
                    }
                });

                children_initiated = true;
            }
    
            update(this.root);
            this.updateTree = update; // Stocker la fonction `update` pour les mises à jour futures
        },
        /**
         * Résout un chemin (absolu ou relatif) en renvoyant le nœud correspondant dans l'arborescence.
         * @param {string} path - Le chemin à résoudre (par ex. "/home/user/docs" ou "docs/..").
         * @returns {Object|null} Le nœud trouvé ou null si le chemin est invalide.
         */
        resolvePath(path) {
            // Si le chemin commence par '/', c'est un chemin absolu : on part de la racine.
            // Sinon, c'est un chemin relatif : on part du dossier courant.
            let current = (path[0] === '/') ? this.root : this.currentNode;
            // Découper le chemin en segments en supprimant les éventuels segments vides.
            const segments = path.split('/').filter(seg => seg.length > 0);

            for (let seg of segments) {
                if (seg === ".") {
                    continue;
                } 
                else if (seg === "..") {
                    if (current.parent) {
                        current = current.parent;
                    } 
                    else {
                        // On ne peut pas monter au-dessus de la racine.
                        return null;
                    }
                } 
                else {
                    // Rechercher parmi les enfants visibles et/ou cachés (selon votre logique)
                    let found = null;
                    const children = current.children || current._children || [];
                    found = children.find(child => child.data.name === seg && child.data.type === 'd');
                    if (!found) {
                        // Si le dossier n'est pas trouvé, le chemin est invalide
                        return null;
                    }
                    current = found;
                }
            }
            return current;
        },
        isPathToCurrentNode(node) {
            let currentNode = this.currentNode;
            while (currentNode) {
                if (currentNode.id === node.id && currentNode.depth == node.depth ) {// Si le nœud actuel est le nœud cible en fonction de l'id et du depth
                    return true;
                }
                currentNode = currentNode.parent;
            }
            return false;
        },
        findNodeInTree(node, nodeName, depth) {
            if (node?.data?.name == nodeName && (node.depth == depth || depth == undefined) ) {
                return node;
            }

            if (node.children) {
                for (let child of node.children) {
                    const found = this.findNodeInTree(child, nodeName, depth);

                    if (found) {
                        return found;
                    }
                }
            }
            else if(node._children){
                for (let child of node._children) {
                    const found = this.findNodeInTree(child, nodeName, depth);

                    if (found) {
                        return found;
                    }
                }
            }

            return null;
        },
        updateNode(node_parent, nodeName, depth, node_update) {
            if ( node_parent?.data?.name == nodeName && (node_parent.depth == depth || depth == undefined) ) {
                return;
            }

            if (node_parent.children) {
                for (let child of node_parent.children) {
                    if (child.name == nodeName) {
                        Object.assign(child, node_update);
                        return;
                    }
                    this.updateNode(child, nodeName, depth, node_update);
                }
            }
            else if (node_parent._children) {
                for (let child of node_parent._children) {
                    if (child.name == nodeName) {
                        Object.assign(child, node_update);
                        return;
                    }
                    this.updateNode(child, nodeName, depth, node_update);
                }
            }

            return null;
        },
        navigateTerminal(event){
            switch (event.key) {
                case "ArrowUp":
                
                    if(this.cursorHistory < this.commandHistory.length){
                        this.cursorHistory += 1
                        this.command = this.commandHistory.slice().reverse()[this.cursorHistory-1].command
                    }

                    break;
                case "ArrowDown":

                    if(this.cursorHistory - 1 >= 0){
                        this.cursorHistory -= 1;

                        if(this.cursorHistory == 0){
                            this.command = "";
                            break
                        }

                        this.command = this.commandHistory.slice().reverse()[this.cursorHistory-1].command
                    }

                    break;
                case "Tab":

                    event.preventDefault();

                    if (event.type === 'keydown') {
                        this.autoCompleteCommand();
                    }

                    break;
                default:
                    break;
            }
        },
        autoCompleteCommand() {
            const args = this.command.trim().split(' ');
            const cmd = args[0];

            if ( args.length === 1 ) {// Autocomplétion de la commande
                const commands = this.availableCommands;

                const matches = commands.filter(c => c.startsWith(cmd));

                if (matches.length === 1) {
                    this.command = matches[0] + ' ';
                } 
                else if (matches.length > 1) {
                    this.output = `Suggestions: ${matches.join(', ')}`;

                    const tooltip = this.buildCommandTooltip('', 'info', this.output);
                    this.commandHistory.push({ 
                        command: "", 
                        state: "info",
                        output: this.output,
                        tooltip,
                    });

                    setTimeout(()=>{
                        $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
                    }, 50)
                }
            } 
            else {// Autocomplétion des paramètres
                const lastParam = args[args.length - 1];
                if (!lastParam || lastParam.startsWith('-')) {
                    return;
                }

                const context = this.getAutocompleteContext(lastParam);
                if (!context) {
                    return;
                }

                let baseNodeResult = null;
                if (!context.dirPath) {
                    baseNodeResult = { node: this.currentNode };
                } 
                else if (context.dirPath === '/') {
                    baseNodeResult = { node: this.root };
                } 
                else {
                    baseNodeResult = this.getNodeFromPath(context.dirPath, { includeFiles: false });
                }

                const baseNode = baseNodeResult?.node;
                if (!baseNode) {
                    return;
                }

                const availableChildren = baseNode.children || baseNode._children || [];
                const matches = availableChildren.filter(child => child.data.name.startsWith(context.partial));

                if (matches.length === 1) {
                    const matchNode = matches[0];
                    let completion = `${context.basePrefix}${matchNode.data.name}`;
                    if (matchNode.data.type === 'd') {
                        completion += '/';
                    } 
                    else {
                        completion += ' ';
                    }

                    const newArgs = args.slice(0, -1).concat(completion);
                    this.command = newArgs.join(' ');
                } 
                else if (matches.length > 1) {
                    const suggestions = matches.map(match => match.data.name);
                    this.output = `Suggestions: ${suggestions.join(', ')}`;
                    
                    const tooltip = this.buildCommandTooltip('', 'info', this.output);
                    this.commandHistory.push({ 
                        command: "", 
                        state: "info",
                        output: this.output,
                        tooltip,
                    });
                    
                    setTimeout(()=>{
                        $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
                    }, 50)
                }
            }
        },
        beginTutorial() {
            this.tutorial.showIntro = false;
            this.tutorial.active = true;
            this.tutorial.completed = false;
            this.tutorial.showSuccess = false;
            this.tutorial.currentStep = 0;
            this.tutorial.feedback = '';
            this.tutorial.feedbackType = '';
            this.tutorialGuidance.introShown = false;
            this.tutorialGuidance.helpHintShown = false;
            this.tutorialGuidance.persistentId = null;
            if (this.showCommandHint) {
                this.$nextTick(() => this.maybeShowTutorialIntroHint());
            }
        },
        skipTutorial() {
            this.tutorial.showIntro = false;
            this.tutorial.active = false;
            this.tutorial.showSuccess = false;
            this.tutorial.feedback = '';
            this.tutorial.feedbackType = '';
        },
        finishTutorial() {
            this.tutorial.completed = true;
            this.tutorial.active = false;
            this.tutorial.feedback = 'Mission accomplie, continue librement !';
            this.tutorial.feedbackType = 'success';
            this.tutorial.showSuccess = false;
            this.stats.tutorialCompleted = true;
            this.checkBadges();
            this.announceRobot('🚀 Mission accomplie ! Tu peux poursuivre librement 🚀', {
                duration: 4500,
                mood: 'success',
            });
        },
        handleTutorialProgress(cmd, params, commandState = '') {
            if (!this.tutorial.active || this.tutorial.showIntro || this.tutorial.completed) {
                return;
            }

            const step = this.tutorial.steps[this.tutorial.currentStep];
            if (!step) {
                return;
            }

            const normalizedCmd = (cmd || '').toLowerCase();
            const paramsList = Array.isArray(params)
                ? params.filter((param) => typeof param === 'string' && param.trim() !== '')
                : (typeof params === 'string' && params.trim() !== '' ? [params] : []);
            const currentNodePath = this.currentNode ? this.getPath(this.currentNode) : '';
            const currentPath = currentNodePath ? (currentNodePath.replace('root', '') || '/') : '/';
            const documentsNode = this.root ? this.getNodeFromPath('/home/user/documents') : null;
            const archivesNode = this.root ? this.getNodeFromPath('/home/user/documents/archives') : null;
            const missionNode = this.root ? this.getNodeFromPath('/home/user/documents/mission') : null;
            const briefingNode = this.root ? this.getNodeFromPath('/home/user/documents/mission/briefing.txt') : null;
            let success = false;

            switch (step.id) {
                case 'help':
                    success = normalizedCmd === 'help';
                    break;
                case 'pwd':
                    success = normalizedCmd === 'pwd';
                    break;
                case 'ls':
                    success = normalizedCmd === 'ls';
                    break;
                case 'cd-documents':
                    success = normalizedCmd === 'cd' && currentPath.endsWith('/home/user/documents');
                    break;
                case 'cd-parent': {
                    const targetParam = paramsList[0] ? paramsList[0].replace(/\/+$/, '') : '';
                    success = normalizedCmd === 'cd'
                        && ['..', '../'].some((pattern) => pattern.replace(/\/+$/, '') === targetParam)
                        && currentPath.endsWith('/home/user');
                    break;
                }
                case 'cd-documents-return':
                    success = normalizedCmd === 'cd' && currentPath.endsWith('/home/user/documents');
                    break;
                case 'rm-archives':
                    success = !archivesNode;
                    break;
                case 'mkdir-mission':
                    success = !!missionNode;
                    break;
                case 'cd-mission':
                    success = normalizedCmd === 'cd' && currentPath.endsWith('/home/user/documents/mission');
                    break;
                case 'touch-briefing':
                    success = !!briefingNode;
                    break;
                default:
                    success = false;
            }

            if (success) {
                this.tutorial.feedback = step.success || 'Étape validée.';
                this.tutorial.feedbackType = 'success';
                let robotMessage = step.success || '';
                const mnemonic = this.getMnemonicHint(step.id);
                if (mnemonic) {
                    robotMessage += ` ${mnemonic}`;
                }
                if (robotMessage) {
                    this.announceRobot(robotMessage, {
                        duration: 5200,
                        mood: 'success',
                        type: 'success',
                        icon: 'mdi-check-circle',
                    });
                }
                this.tutorial.currentStep += 1;
                if (this.tutorial.currentStep > 0) {
                    this.clearTutorialRobotHint('help');
                }
                this.playSoundEffect('success');
                if (this.tutorial.currentStep >= this.tutorial.steps.length) {
                    this.finishTutorial();
                }
            } else {
                if (!normalizedCmd) {
                    this.tutorial.feedback = '';
                    this.tutorial.feedbackType = '';
                    return;
                }
                const errorMessage = this.getTutorialErrorMessage(step, {
                    normalizedCmd,
                    paramsList,
                    currentPath,
                    archivesExists: !!archivesNode,
                    missionExists: !!missionNode,
                    briefingExists: !!briefingNode,
                });
                this.tutorial.feedback = errorMessage || 'Cette commande ne valide pas encore cette étape. Réessaie en suivant l\'indice ci-dessus.';
                this.tutorial.feedbackType = 'hint';
                const soundType = commandState === 'valid' ? 'warning' : 'error';
                this.playSoundEffect(soundType);
                if (commandState === 'valid') {
                    this.robotMoodOverride = 'warning';
                    const warningText = errorMessage || 'Cette commande ne valide pas encore cette étape.';
                    this.announceRobot(warningText, {
                        duration: 4600,
                        mood: 'warning',
                        type: 'warning',
                        icon: 'mdi-alert-circle-outline',
                    });
                }
            }
        },
        getTutorialErrorMessage(step, context) {
            const {
                normalizedCmd,
                paramsList,
                currentPath,
                archivesExists,
                missionExists,
                briefingExists,
            } = context;
            const lowerParams = paramsList.map((param) => param.toLowerCase());
            const mentions = (term) =>
                lowerParams.some((param) => !param.startsWith('-') && param.includes(term));
            const hasFlag = (flag) =>
                lowerParams.some((param) => param.startsWith('-') && param.includes(flag));
            const firstParam = paramsList[0] || '';

            switch (step.id) {
                case 'help':
                    if (normalizedCmd !== 'help') {
                        return 'Avant de foncer, tape `help` pour découvrir toutes les commandes disponibles.';
                    }
                    break;
                case 'pwd':
                    if (normalizedCmd !== 'pwd') {
                        return 'Cette étape vérifie ta position : tape `pwd` pour afficher le chemin courant.';
                    }
                    break;
                case 'ls':
                    if (normalizedCmd !== 'ls') {
                        return 'Utilise `ls` (ou `ls -l`) pour afficher le contenu du dossier courant.';
                    }
                    break;
                case 'cd-documents':
                    if (normalizedCmd !== 'cd') {
                        return 'Rejoins le dossier `documents` avec la commande `cd`.';
                    }
                    if (!paramsList.length) {
                        return 'Précise le dossier à atteindre : `cd documents`.';
                    }
                    if (!mentions('documents')) {
                        return `Cette étape attend le dossier 'documents', pas '${firstParam}'.`;
                    }
                    return `Tu es encore sur ${currentPath || '/'}. Vise /home/user/documents.`;
                case 'cd-parent':
                    if (normalizedCmd !== 'cd') {
                        return 'Utilise `cd` pour remonter d’un niveau.';
                    }
                    if (!paramsList.length) {
                        return 'Ajoute `..` (ou `../`) après `cd` pour viser le dossier parent : `cd ..`.';
                    }
                    if (firstParam.replace(/\/+$/, '') !== '..') {
                        return 'Cette étape vérifie l’utilisation de `cd ..` (ou `cd ../`). Réessaie avec ce raccourci.';
                    }
                    return 'Tu devrais voir /home/user comme dossier courant après `cd ..`.';
                case 'cd-documents-return':
                    if (normalizedCmd !== 'cd') {
                        return 'Après avoir reculé, reviens dans `documents` avec `cd`.';
                    }
                    if (!paramsList.length) {
                        return 'Précise la destination : `cd documents`.';
                    }
                    if (!mentions('documents')) {
                        return `Cette étape attend un retour vers 'documents', pas '${firstParam}'.`;
                    }
                    return 'On t’attend dans /home/user/documents avant de reprendre l’opération.';
                case 'rm-archives':
                    if (normalizedCmd !== 'rm') {
                        return 'On attend la suppression du dossier `archives` avec `rm`.';
                    }
                    if (!paramsList.length) {
                        return 'Ajoute l\'élément à supprimer : `rm -r archives`.';
                    }
                    if (!mentions('archives')) {
                        return 'La cible à supprimer est `archives`.';
                    }
                    if (!hasFlag('r')) {
                        return 'Ajoute l\'option `-r` pour supprimer le dossier : `rm -r archives`.';
                    }
                    if (archivesExists) {
                        return 'Le dossier `archives` existe encore. Lance `rm -r archives` depuis /home/user/documents.';
                    }
                    break;
                case 'mkdir-mission':
                    if (normalizedCmd !== 'mkdir') {
                        return 'Crée le dossier `mission` avec `mkdir`.';
                    }
                    if (!paramsList.length) {
                        return 'Indique le nom du dossier à créer : `mkdir mission`.';
                    }
                    if (!mentions('mission')) {
                        return `Le dossier attendu s'appelle 'mission', pas '${firstParam}'.`;
                    }
                    return 'Je ne vois toujours pas le dossier `mission` dans documents. Crée-le ici avant de continuer.';
                case 'cd-mission':
                    if (normalizedCmd !== 'cd') {
                        return 'Utilise `cd` pour te déplacer dans le dossier `mission`.';
                    }
                    if (!paramsList.length) {
                        return 'Ajoute le dossier cible : `cd mission`.';
                    }
                    if (!mentions('mission')) {
                        return `Cette étape attend le dossier 'mission', pas '${firstParam}'.`;
                    }
                    return `Le répertoire courant est ${currentPath || '/'}. Rejoins /home/user/documents/mission.`;
                case 'touch-briefing':
                    if (normalizedCmd !== 'touch') {
                        return 'Crée le fichier `briefing.txt` avec `touch`.';
                    }
                    if (!paramsList.length) {
                        return 'Indique le nom du fichier : `touch briefing.txt`.';
                    }
                    if (!mentions('briefing')) {
                        return `Le fichier attendu est 'briefing.txt', pas '${firstParam}'.`;
                    }
                    if (!missionExists) {
                        return 'Crée d\'abord le dossier `mission` puis exécute `touch briefing.txt` depuis ce dossier.';
                    }
                    if (!briefingExists) {
                        return 'Le fichier n\'a pas été trouvé dans `mission`. Lance `touch briefing.txt` à cet emplacement.';
                    }
                    break;
                default:
                    break;
            }

            return '';
        },
        sanitizeHistoryOutput(value) {
            if (!value) {
                return '';
            }
            return value
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },
        buildCommandTooltip(commandText = '', state = '', output = '') {
            const cmdName = (commandText || '').trim().split(' ')[0] || '';
            const baseDesc = this.commandDescriptions[cmdName] || (cmdName ? `Commande ${cmdName}` : 'Information système');
            const cleanedOutput = this.sanitizeHistoryOutput(output);
            let stateNote = '';
            switch (state) {
                case 'error':
                    stateNote = cleanedOutput ? `Erreur : ${cleanedOutput}` : 'Erreur détectée.';
                    break;
                case 'warning':
                    stateNote = cleanedOutput ? `Attention : ${cleanedOutput}` : 'Attention requise.';
                    break;
                case 'info':
                    stateNote = cleanedOutput || 'Suggestion du terminal.';
                    break;
                default:
                    stateNote = cleanedOutput;
            }
            return [baseDesc, stateNote].filter(Boolean).join(' • ');
        },
        getHistoryTooltip(entry) {
            if (!entry) {
                return '';
            }
            return entry.tooltip || this.buildCommandTooltip(entry.command, entry.state, entry.output);
        },
        hasChildNamed(node, name) {
            if (!node) return false;
            const children = node.children || node._children || [];
            return children.some((child) => (child.data?.name || child.name) === name);
        },
        trackDirectoryVisit(path) {
            const normalized = path ? (path.replace('root', '') || '/') : '/';
            if (!this.stats.visitedPaths.includes(normalized)) {
                this.stats.visitedPaths.push(normalized);
                this.checkBadges();
            }
        },
        awardBadge(id) {
            const badge = this.badges.find((b) => b.id === id);
            if (!badge || badge.earned) {
                return;
            }
            badge.earned = true;
            this.badgeSnackbar.message = badge.title;
            this.badgeSnackbar.icon = badge.icon;
            this.badgeSnackbar.description = badge.description;
            this.badgeSnackbar.show = true;
            if (this.badgeSnackbar.timeoutId) {
                clearTimeout(this.badgeSnackbar.timeoutId);
            }
            this.badgeSnackbar.timeoutId = setTimeout(() => {
                this.badgeSnackbar.show = false;
                this.badgeSnackbar.timeoutId = null;
            }, 4500);
        },
        checkBadges() {
            if (this.stats.visitedPaths.length >= 10) {
                this.awardBadge('explorer');
            }
            if (this.stats.createdDirectory && this.stats.createdFile) {
                this.awardBadge('architecte');
            }
            if (this.stats.removedDirectory) {
                this.awardBadge('nettoyeur');
            }
            if (this.stats.manUses >= 3) {
                this.awardBadge('sage');
            }
            if (this.stats.tutorialCompleted) {
                this.awardBadge('mentor');
            }
            this.persistBadges();
        },
        openBadgePanel() {
            this.showBadgePanel = true;
            if (this.badgeSnackbar.timeoutId) {
                clearTimeout(this.badgeSnackbar.timeoutId);
                this.badgeSnackbar.timeoutId = null;
            }
            this.badgeSnackbar.show = false;
        },
        saveCommandHistory() {
            const payload = {
                history: this.commandHistory,
                timestamp: Date.now(),
            };
            this.$store.commit('setCommandHistory', payload);
        },
        loadCommandHistory() {
            const oneHour = 60 * 60 * 1000;
            const storedTimestamp = this.$store.state.commandHistoryTimestamp;
            const storedHistory = this.$store.state.commandHistory || [];
            if (storedTimestamp && Date.now() - storedTimestamp <= oneHour) {
                this.commandHistory = [...storedHistory];
            } else {
                this.commandHistory = [];
                this.$store.commit('setCommandHistory', { history: [], timestamp: null });
            }
            if (this.commandHistory.length > 0) {
                this.showCommandHint = false;
            }
        },
        loadBadgeState() {
            const badgeState = this.$store.state.badgeState || {};
            const earnedMap = badgeState.earned || {};
            this.badges = this.badges.map((badge) => ({
                ...badge,
                earned: !!earnedMap[badge.id],
            }));
            const storedStats = badgeState.stats || {};
            this.stats = {
                visitedPaths: storedStats.visitedPaths ? [...storedStats.visitedPaths] : [],
                createdDirectory: !!storedStats.createdDirectory,
                createdFile: !!storedStats.createdFile,
                removedDirectory: !!storedStats.removedDirectory,
                manUses: storedStats.manUses || 0,
                tutorialCompleted: !!storedStats.tutorialCompleted,
            };
        },
        persistBadges() {
            const earnedMap = {};
            this.badges.forEach((badge) => {
                if (badge.earned) {
                    earnedMap[badge.id] = true;
                }
            });
            this.$store.commit('setBadgeState', {
                earned: earnedMap,
                stats: {
                    visitedPaths: [...this.stats.visitedPaths],
                    createdDirectory: this.stats.createdDirectory,
                    createdFile: this.stats.createdFile,
                    removedDirectory: this.stats.removedDirectory,
                    manUses: this.stats.manUses,
                    tutorialCompleted: this.stats.tutorialCompleted,
                },
            });
        },
        executeCommand() {
            this.cursorHistory = 0;
            const issuedCommand = this.command;
            const trimmedInput = (issuedCommand || '').trim();
            const { mainPart, redirectionPart } = this.extractRedirection(trimmedInput);
            const args = this.tokenizeArguments(mainPart);
            const redirectionParse = this.parseRedirectionPart(redirectionPart);

            if (redirectionParse?.error) {
                this.output = redirectionParse.error;
                this.pushCommandToHistory(issuedCommand, 'error', this.output);
                this.command = '';
                return;
            }

            let redirection = redirectionParse || null;

            if (redirection && !redirection.target) {
                this.output = 'Redirection invalide : aucun fichier cible n\'a été indiqué.';
                this.pushCommandToHistory(issuedCommand, 'error', this.output);
                this.command = '';
                return;
            }

            const cmd = args[0] || '';
            const param = args.slice(1);
            
            let state = 'valid';
            let redirectionPayload = null;
            let redirectionSideOutput = '';

            this.cDirect.from = null;
            this.chmodInfos.data.user = [];
            this.createOutputAnimate();

            if (redirection && !cmd) {
                this.output = 'Redirection impossible : aucune commande à exécuter.';
                this.pushCommandToHistory(issuedCommand, 'error', this.output);
                this.command = '';
                return;
            }

            if (param.includes('-h')) {
                this.output = this.getHelp(cmd);
                this.pushCommandToHistory(issuedCommand, state, this.output);
                this.command = '';
                return;
            }

            switch (cmd) {
                case 'help':
                    this.output = this.getHelp();
                    break;
                case 'man':
                    state = this.manCommand(param[0]);
                    if (state === 'valid') {
                        this.stats.manUses += 1;
                        this.checkBadges();
                    }
                    break;
                case 'chmod':
                    state = this.handleChmod(param);
                    break
                case 'pwd':
                    this.pathWayDirectory();
                    break;
                case 'echo':
                    redirectionPayload = this.echo(param);
                    break;
                case 'cat': {
                    const catResult = this.catCommand(param);
                    state = catResult.state;
                    redirectionPayload = catResult.stdout;
                    redirectionSideOutput = catResult.stderr || '';
                    break;
                }
                case 'head': {
                    const headResult = this.headCommand(param);
                    state = headResult.state;
                    redirectionPayload = headResult.stdout;
                    redirectionSideOutput = headResult.stderr || '';
                    break;
                }
                case 'tail': {
                    const tailResult = this.tailCommand(param);
                    state = tailResult.state;
                    redirectionPayload = tailResult.stdout;
                    redirectionSideOutput = tailResult.stderr || '';
                    break;
                }
                case 'nano':
                    state = this.handleNanoCommand(param);
                    redirectionPayload = '';
                    break;
                case 'cd':
                    state = this.changeDirectory(param);
                    break;
                case 'ls':
                    this.listDirectory(param);
                    break;
                case 'll':
                    this.listDirectory(['-l', ...param]);
                    break;
                case 'mkdir':
                    state = this.makeDirectory(param);
                    break;
                case 'touch':
                    this.createFile(param);
                    break;
                case 'rm':
                    this.removeItem(param);
                    break;
                case '':
                    this.output = ""
                    state = 'warning';
                    break;
                default:
                    this.output = `Commande inconnue : ${cmd}`;
                    state = 'error';
            }

            const beforeRedirectionOutput = this.output;
            if (redirection && state !== 'error') {
                const payload = typeof redirectionPayload === 'string'
                    ? redirectionPayload
                    : (typeof this.output === 'string' ? this.output : '');
                const redirectionState = this.applyOutputRedirection(redirection, payload);
                if (redirectionState === 'error') {
                    state = 'error';
                } else if (state !== 'valid') {
                    const retained = redirectionSideOutput || beforeRedirectionOutput;
                    this.output = retained
                        ? `${retained}\n${this.output}`
                        : this.output;
                } else {
                    state = redirectionState;
                }
            }

            this.handleTutorialProgress(cmd, param, state);

            this.pushCommandToHistory(issuedCommand, state, this.output);
            this.command = '';
        },
        pushCommandToHistory(commandText, state, output) {
            const moodToApply = this.robotMoodOverride || state;
            this.robotMoodOverride = null;
            this.updateRobotMood(moodToApply);
            if (state === 'error') {
                this.playSoundEffect('error');
                const errorMessage = `Erreur détectée. ${this.getRandomErrorEncouragement()}`;
                this.announceRobot(errorMessage, {
                    duration: 3400,
                    mood: 'error',
                    type: 'error',
                    icon: 'mdi-alert-octagon',
                });
            } else if (state === 'warning') {
                this.playSoundEffect('warning');
            }
            const tooltip = this.buildCommandTooltip(commandText, state, output);
            const historyOutput = state !== 'error' ? output : `<span style="color: #fe4444">${output}<span/>`;
            this.commandHistory.push({
                command: commandText,
                state,
                output: historyOutput,
                tooltip,
            });
            this.saveCommandHistory();
            setTimeout(() => {
                $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
            }, 50);
        },
        clearRobotMoodTimers() {
            if (this.robotResetTimer) {
                clearTimeout(this.robotResetTimer);
                this.robotResetTimer = null;
            }
            if (this.robotJumpTimer) {
                clearTimeout(this.robotJumpTimer);
                this.robotJumpTimer = null;
            }
            if (this.robotFlickerTimer) {
                clearTimeout(this.robotFlickerTimer);
                this.robotFlickerTimer = null;
            }
            if (this.robotBlinkTimer) {
                clearTimeout(this.robotBlinkTimer);
                this.robotBlinkTimer = null;
            }
            this.robotEyesClosed = false;
        },
        updateRobotMood(state) {
            if (this.robotHovering && state !== 'loving') {
                return;
            }
            this.clearRobotMoodTimers();
            if (state !== 'default' && this.tutorialGuidance.persistentId) {
                this.clearTutorialRobotHint();
            }
            if (this.robotHovering && state !== 'loving') {
                return;
            }
            if (this.robotResetTimer) {
                clearTimeout(this.robotResetTimer);
                this.robotResetTimer = null;
            }
            if (this.robotJumpTimer) {
                clearTimeout(this.robotJumpTimer);
                this.robotJumpTimer = null;
            }
            if (this.robotFlickerTimer) {
                clearTimeout(this.robotFlickerTimer);
                this.robotFlickerTimer = null;
            }

            switch (state) {
                case 'error':
                    this.robotMood = 'error';
                    break;
                case 'warning':
                    this.robotMood = 'warning';
                    break;
                case 'valid':
                    this.robotMood = 'success';
                    break;
                case 'loving':
                    this.robotMood = 'loving';
                    break;
                default:
                    this.robotMood = 'default';
                    break;
            }
            this.triggerRobotJump();
            this.robotResetTimer = setTimeout(() => {
                this.robotMood = 'default';
                this.robotResetTimer = null;
                this.triggerRobotFlicker();
                this.scheduleNeutralBlink();
            }, 3000);
            if (this.robotMood === 'default') {
                this.scheduleNeutralBlink();
            }
        },
        triggerRobotJump() {
            this.robotJumping = false;
            this.$nextTick(() => {
                this.robotJumping = true;
                this.robotJumpTimer = setTimeout(() => {
                    this.robotJumping = false;
                    this.robotJumpTimer = null;
                }, 700);
            });
        },
        scheduleNeutralBlink() {
            if (this.robotMood !== 'default' || this.robotHovering) {
                return;
            }
            if (this.robotBlinkTimer) {
                clearTimeout(this.robotBlinkTimer);
                this.robotBlinkTimer = null;
            }
            const delay = 3500 + Math.random() * 3000;
            this.robotBlinkTimer = setTimeout(() => {
                this.robotBlinkTimer = null;
                const blinkCount = Math.random() < 0.5 ? 2 : 1;
                this.performBlink(blinkCount);
            }, delay);
        },
        performBlink(count = 1) {
            if (this.robotMood !== 'default' || this.robotHovering) {
                this.robotEyesClosed = false;
                return;
            }
            this.robotEyesClosed = true;
            setTimeout(() => {
                this.robotEyesClosed = false;
                setTimeout(() => {
                    if (count > 1) {
                        this.performBlink(count - 1);
                    } else {
                        this.scheduleNeutralBlink();
                    }
                }, 90);
            }, 160);
        },
        triggerRobotFlicker() {
            if (this.robotFlickerTimer) {
                clearTimeout(this.robotFlickerTimer);
                this.robotFlickerTimer = null;
            }
            this.robotFlicker = false;
            this.$nextTick(() => {
                this.robotFlicker = true;
                this.robotFlickerTimer = setTimeout(() => {
                    this.robotFlicker = false;
                    this.robotFlickerTimer = null;
                }, 800);
            });
        },
        clearRobotTooltipTimer() {
            if (this.robotTooltip.timer) {
                clearTimeout(this.robotTooltip.timer);
                this.robotTooltip.timer = null;
            }
        },
        showRobotTooltipMessage(message, { duration = 4800, auto = false, type = 'default', icon = '' } = {}) {
            this.clearRobotTooltipTimer();
            this.robotTooltip.message = this.highlightCommandNames(message || '');
            this.robotTooltip.visible = true;
            this.robotTooltip.auto = auto;
            this.robotTooltip.type = type || 'default';
            this.robotTooltip.icon = icon || '';
            if (auto) {
                this.robotTooltip.timer = setTimeout(() => {
                    if (this.robotTooltip.auto) {
                        this.robotTooltip.visible = false;
                        this.robotTooltip.auto = false;
                    }
                    this.robotTooltip.timer = null;
                }, duration);
            }
        },
        announceRobot(message, { duration = 5200, mood = null, type = 'default', icon = '' } = {}) {
            if (mood) {
                this.updateRobotMood(mood);
            }
            this.showRobotTooltipMessage(message, { duration, auto: true, type, icon });
            this.tutorialGuidance.persistentId = null;
        },
        showTutorialRobotHint(id, message) {
            if (!message || this.robotHovering || this.robotMood !== 'default') {
                return;
            }
            this.showRobotTooltipMessage(message, {
                auto: false,
                type: 'info',
                icon: 'mdi-information-outline',
            });
            this.robotTooltip.auto = false;
            this.tutorialGuidance.persistentId = id;
        },
        clearTutorialRobotHint(id = null) {
            if (!this.tutorialGuidance.persistentId) {
                return;
            }
            if (id && this.tutorialGuidance.persistentId !== id) {
                return;
            }
            this.tutorialGuidance.persistentId = null;
            if (!this.robotTooltip.auto) {
                this.robotTooltip.visible = false;
            }
        },
        maybeShowTutorialIntroHint() {
            if (
                !this.tutorial.active ||
                this.tutorial.showIntro ||
                this.tutorial.completed ||
                !this.showCommandHint ||
                this.tutorialGuidance.introShown
            ) {
                return;
            }
            this.showTutorialRobotHint('intro', 'Bienvenue dans le cockpit ! Clique sur le champ de saisie pour prendre les commandes.');
            this.tutorialGuidance.introShown = true;
        },
        maybeShowTutorialHelpHint() {
            if (
                !this.tutorial.active ||
                this.tutorial.showIntro ||
                this.tutorial.completed ||
                this.showCommandHint ||
                this.tutorial.currentStep !== 0 ||
                this.tutorialGuidance.helpHintShown
            ) {
                return;
            }
            this.showTutorialRobotHint('help', 'Tu es maintenant aux commandes. Besoin d’un coup de pouce ? Tape simplement `help`. Puis valide avec Entrée. ↵');
            this.tutorialGuidance.helpHintShown = true;
        },
        buildTreePathNodes(startNode, endNode) {
            if (!startNode || !endNode) {
                return [];
            }
            if (startNode === endNode) {
                return [startNode];
            }
            const startAncestors = [];
            let cursor = startNode;
            while (cursor) {
                startAncestors.push(cursor);
                cursor = cursor.parent;
            }
            const endAncestorSet = new Set();
            cursor = endNode;
            while (cursor) {
                endAncestorSet.add(cursor);
                cursor = cursor.parent;
            }
            let lca = null;
            for (const candidate of startAncestors) {
                if (endAncestorSet.has(candidate)) {
                    lca = candidate;
                    break;
                }
            }
            if (!lca) {
                return [];
            }
            const path = [];
            cursor = startNode;
            while (cursor && cursor !== lca) {
                path.push(cursor);
                cursor = cursor.parent;
            }
            path.push(lca);
            const downward = [];
            cursor = endNode;
            while (cursor && cursor !== lca) {
                downward.push(cursor);
                cursor = cursor.parent;
            }
            while (downward.length) {
                const node = downward.pop();
                if (node !== lca) {
                    path.push(node);
                }
            }
            return path;
        },
        animateTreePath(fromNode, toNode) {
            if (!this.treeSvg || !fromNode || !toNode) {
                return;
            }
            const nodes = this.buildTreePathNodes(fromNode, toNode);
            if (!nodes.length) {
                return;
            }
            const svg = this.treeSvg;
            svg.selectAll('.cd-path-overlay').remove();

            const points = nodes.map((node) => ({
                x: node.y,
                y: node.x,
            }));

            if (points.length === 1) {
                svg.append('circle')
                    .attr('class', 'cd-path-overlay')
                    .attr('cx', points[0].x)
                    .attr('cy', points[0].y)
                    .attr('r', 6)
                    .attr('fill', '#f7b801')
                    .attr('opacity', 0.95)
                    .transition()
                    .duration(800)
                    .attr('r', 20)
                    .attr('opacity', 0)
                    .remove();
                return;
            }

            const lineGenerator = d3.line()
                .x((d) => d.x)
                .y((d) => d.y)
                .curve(d3.curveMonotoneX);

            const path = svg.append('path')
                .attr('class', 'cd-path-overlay')
                .attr('d', lineGenerator(points))
                .attr('fill', 'none')
                .attr('stroke', '#404bee')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '6,4')
                .attr('opacity', 0.85);

            const pathEl = path.node();
            const totalLength = pathEl.getTotalLength();

            const marker = svg.append('circle')
                .attr('class', 'cd-path-overlay')
                .attr('r', 15)
                .attr('fill', '#279CF5')
                .attr('stroke', '#333')
                .attr('stroke-width', 5.5)
                .attr('opacity', 0.5)

            marker.transition()
                .duration(2000)
                .ease(d3.easeCubicInOut)
                .attrTween('transform', () => (t) => {
                    const point = pathEl.getPointAtLength(t * totalLength);
                    return `translate(${point.x}, ${point.y})`;
                })
                .on('end', () => {
                    marker.transition().duration(300).attr('opacity', 0).remove();
                });

            path.transition()
                .delay(2000)
                .duration(400)
                .attr('opacity', 0)
                .remove();
        },
        stopAllActiveAudios() {
            this.stopTalkSound();
            if (this.activeAudios && this.activeAudios.length) {
                this.activeAudios.forEach((audio) => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                    } catch (e) {
                        // ignore
                    }
                });
                this.activeAudios = [];
            }
            Object.keys(this.audioTimers || {}).forEach((key) => {
                if (this.audioTimers[key]) {
                    clearTimeout(this.audioTimers[key]);
                    this.audioTimers[key] = null;
                }
            });
        },
        loadAudioEffects() {
            if (typeof Audio === 'undefined') {
                return;
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
                warning: [
                    '/son/robot-warning.mp3',
                    '/son/robot-warning-8-bit-1.mp3',
                ],
                error: [
                    '/son/robot-error-1.mp3',
                ],
                success: [
                    '/son/robot-succes-1.mp3',
                    '/son/robot-success-winlevel.mp3',
                ],
                beep: [
                    '/son/robot-beep-1.mp3',
                ],
            };
        },
        startTalkSound() {
            if (!this.robotSoundEnabled) {
                return;
            }
            if (this.talkLoopAudio) {
                return;
            }
            const talks = this.audioSources?.talk || [];
            if (!talks.length) {
                return;
            }
            const src = talks[Math.floor(Math.random() * talks.length)];
            try {
                const audio = new Audio(src);
                audio.loop = true;
                const playPromise = audio.play();
                if (playPromise?.catch) {
                    playPromise.catch(() => {});
                }
                this.talkLoopAudio = audio;
            } catch (error) {
                this.talkLoopAudio = null;
            }
        },
        stopTalkSound() {
            if (this.talkLoopAudio) {
                try {
                    this.talkLoopAudio.pause();
                    this.talkLoopAudio.currentTime = 0;
                } catch (e) {
                    // ignore
                }
                this.talkLoopAudio = null;
            }
        },
        playSoundEffect(type) {
            if (!this.robotSoundEnabled) {
                return;
            }
            const sources = this.audioSources[type] || [];
            if (!sources.length) {
                return;
            }
            const src = sources[Math.floor(Math.random() * sources.length)];
            let audio;
            try {
                audio = new Audio(src);
            } catch (error) {
                return;
            }
            const stopAudio = () => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (e) {
                    // ignore
                }
                this.activeAudios = this.activeAudios.filter((entry) => entry !== audio);
            };
            audio.addEventListener('ended', stopAudio);
            const playPromise = audio.play();
            if (playPromise?.catch) {
                playPromise.catch(() => {});
            }
            this.activeAudios.push(audio);
            const durationHints = {
                talk: 2500,
                warning: 2600,
                error: 2800,
                success: 3200,
                beep: 1200,
            };
            const timeout = durationHints[type] || 2800;
            if (this.audioTimers[type]) {
                clearTimeout(this.audioTimers[type]);
            }
            this.audioTimers[type] = setTimeout(() => {
                stopAudio();
                this.audioTimers[type] = null;
            }, timeout);
        },
        toggleRobotSound() {
            const nextState = !this.robotSoundEnabled;
            this.robotSoundEnabled = nextState;
            if (!nextState) {
                this.stopTalkSound();
                this.stopAllActiveAudios();
            }
            this.showRobotSoundToast(nextState ? 'Son activé 🔊' : 'Son coupé 🔇');
            if (nextState) {
                this.playSoundEffect('beep');
            }
        },
        showRobotSoundToast(message) {
            if (this.robotSoundToast.timer) {
                clearTimeout(this.robotSoundToast.timer);
                this.robotSoundToast.timer = null;
            }
            this.robotSoundToast.message = message;
            this.robotSoundToast.visible = true;
            this.robotSoundToast.timer = setTimeout(() => {
                this.robotSoundToast.visible = false;
                this.robotSoundToast.timer = null;
            }, 1500);
        },
        handleRobotHover() {
            this.robotHovering = true;
            this.clearRobotMoodTimers();
            this.clearTutorialRobotHint();
            this.robotJumping = false;
            this.robotFlicker = false;
            this.robotMood = 'loving';
            const dialogue = this.getRobotDialogue();
            const icon = this.getRobotDialogueIcon();
            this.showRobotTooltipMessage(dialogue, {
                auto: false,
                type: 'default',
                icon,
            });
            this.startTalkSound();
        },
        handleRobotLeave() {
            this.robotHovering = false;
            if (!this.robotTooltip.auto) {
                this.robotTooltip.visible = false;
            }
            this.robotTooltip.auto = false;
            this.clearRobotTooltipTimer();
            this.robotMood = 'default';
            this.triggerRobotFlicker();
            this.scheduleNeutralBlink();
            this.stopTalkSound();
        },
        getRobotDialogue() {
            if (!this.robotTooltip.greetingShown) {
                this.robotTooltip.greetingShown = true;
                this.robotTooltip.lastMessage = 'Salut !';
                return '👋 Salut ! Je suis ECHO, ton assistant virtuel. Tu peux couper ou activer mon son 🔊 en cliquant sur ma tête.';
            }
            let message = this.robotTooltip.lastMessage;
            const pool = this.robotDialoguePool;
            if (!pool.length) {
                return message;
            }
            while (message === this.robotTooltip.lastMessage && pool.length > 1) {
                const idx = Math.floor(Math.random() * pool.length);
                message = pool[idx];
            }
            this.robotTooltip.lastMessage = message;
            return message;
        },
        getRobotDialogueIcon() {
            const pool = this.robotDialogueIconPool || [];
            if (!pool.length) {
                return 'mdi-robot';
            }
            const idx = Math.floor(Math.random() * pool.length);
            return pool[idx];
        },
        getRandomErrorEncouragement() {
            const pool = this.robotErrorEncouragements || [];
            if (!pool.length) {
                return 'Tu vas y arriver.';
            }
            const idx = Math.floor(Math.random() * pool.length);
            return pool[idx];
        },
        getMnemonicHint(stepId) {
            const hints = {
                pwd: 'Astuce mémo: `pwd` signifie **Path Way Directory**, pour afficher ta position actuelle.',
                ls: 'Astuce mémo: `ls` vient de **List**, il affiche le contenu du dossier.',
                'cd-documents': 'Astuce mémo: `cd` signifie **Change Directory**, idéal pour entrer dans un dossier.',
                'cd-parent': 'Astuce mémo: `cd ..` remonte d’un cran — **Change Directory** vers le parent.',
                'cd-documents-return': 'Astuce mémo: `cd documents` te ramène dans le dossier ciblé (**Change Directory**).',
                'cd-mission': 'Astuce mémo: utilise `cd` (**Change Directory**) pour entrer dans mission.',
                'rm-archives': 'Astuce mémo: `rm` vient de **Remove**, utile pour supprimer.',
                'mkdir-mission': 'Astuce mémo: `mkdir` signifie **Make Directory**, pour créer un dossier.',
                'touch-briefing': 'Astuce mémo: `touch` crée ou met à jour un fichier en une commande.',
            };
            return hints[stepId] || '';
        },
        escapeHtml(text = '') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        highlightCommandNames(message = '') {
            if (!message) {
                return '';
            }
            let safeMessage = this.escapeHtml(message);
            safeMessage = safeMessage.replace(/<code>(.+?)<\/code>/gi, (_m, content) => {
                const highlighted = `<span class="robot-command">${content}</span>`;
                return `<span class="robot-mnemonic">${highlighted}</span>`;
            }).replace(/\*\*(.+?)\*\*/g, (_m, content) => {
                const highlighted = `<span class="robot-command">${content}</span>`;
                return `<span class="robot-mnemonic">${highlighted}</span>`;
            });
            const keywords = this.robotCommandKeywords || [];
            if (keywords.length) {
                const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
                safeMessage = safeMessage.replace(regex, (match) => {
                    return `<span class="robot-command">${match}</span>`;
                });
            }
            return safeMessage;
        },
        truncateText(message, maxLength = 300) {
            if (!message) {
                return '';
            }
            if (message.length <= maxLength) {
                return message;
            }
            return `${message.slice(0, maxLength)}...`;
        },
        extractRedirection(input = '') {
            let inDouble = false;
            let inSingle = false;
            let escape = false;
            for (let i = 0; i < input.length; i++) {
                const char = input[i];
                if (escape) {
                    escape = false;
                    continue;
                }
                if (char === '\\') {
                    escape = true;
                    continue;
                }
                if (char === '"' && !inSingle) {
                    inDouble = !inDouble;
                    continue;
                }
                if (char === '\'' && !inDouble) {
                    inSingle = !inSingle;
                    continue;
                }
                if (char === '>' && !inDouble && !inSingle) {
                    return {
                        mainPart: input.slice(0, i).trimEnd(),
                        redirectionPart: input.slice(i).trimStart(),
                    };
                }
            }
            return { mainPart: input, redirectionPart: '' };
        },
        tokenizeArguments(input = '') {
            const tokens = [];
            let buffer = '';
            let inDouble = false;
            let inSingle = false;
            for (let i = 0; i < input.length; i++) {
                const char = input[i];
                if (char === '\\') {
                    const next = input[i + 1];
                    if (next === undefined) {
                        buffer += '\\';
                        continue;
                    }
                    if (!inSingle && next === '"') {
                        buffer += '"';
                        i += 1;
                        continue;
                    }
                    if (!inDouble && next === "'") {
                        buffer += '\'';
                        i += 1;
                        continue;
                    }
                    buffer += '\\';
                    continue;
                }
                if (char === '"' && !inSingle) {
                    inDouble = !inDouble;
                    continue;
                }
                if (char === '\'' && !inDouble) {
                    inSingle = !inSingle;
                    continue;
                }
                if (!inDouble && !inSingle && /\s/.test(char)) {
                    if (buffer.length) {
                        tokens.push(buffer);
                        buffer = '';
                    }
                    continue;
                }
                buffer += char;
            }
            if (buffer.length) {
                tokens.push(buffer);
            }
            return tokens;
        },
        parseRedirectionPart(part = '') {
            if (!part) {
                return null;
            }
            const trimmed = part.trim();
            if (!trimmed.startsWith('>')) {
                return null;
            }
            let append = false;
            let remainder = trimmed;
            if (remainder.startsWith('>>')) {
                append = true;
                remainder = remainder.slice(2);
            } else {
                remainder = remainder.slice(1);
            }
            remainder = remainder.trim();
            if (!remainder) {
                return { error: 'Redirection invalide : aucun fichier cible n\'a été indiqué.' };
            }
            const targets = this.tokenizeArguments(remainder);
            if (!targets.length) {
                return { error: 'Redirection invalide : aucun fichier cible n\'a été indiqué.' };
            }
            if (targets.length > 1) {
                return { error: 'Redirection invalide : une seule cible est autorisée.' };
            }
            return { append, target: targets[0] };
        },
        getHelp(cmd = '') {
            const helpMessages = {
                '': `
                    Commandes disponibles :
                    - man : Affiche l'aide détaillée d'une commande
                    - help : Affiche ce message d'aide
                    - pwd : Affiche le chemin du répertoire courant
                    - echo : Affiche un message
                    - cd : Change de répertoire
                    - ls : Liste les fichiers et dossiers
                    - ll : 'Alias de ls -l : liste détaillée des fichiers.',
                    - mkdir : Crée un nouveau dossier
                    - touch : Crée un nouveau fichier
                    - rm : Supprime un fichier ou un dossier
                    - chmod : Change les permissions d'un fichier ou d'un dossier
                    - cat : Lit et affiche le contenu d'un fichier (peut être redirigé avec > ou >>)
                    - head : Affiche les premières lignes d'un fichier (option -n)
                    - tail : Affiche les dernières lignes d'un fichier (option -n)
                    - nano : Ouvre un éditeur pour modifier un fichier
                `,
                'pwd': 'Usage: pwd [-h]\nAffiche le chemin du répertoire courant.',
                'echo': 'Usage: echo [-h] [message]\nAffiche un message.',
                'cd': 'Usage: cd [-h] [répertoire]\nChange de répertoire.',
                'ls': 'Usage: ls [-h] [-a] [-l]\nListe les fichiers et dossiers.',
                'mkdir': 'Usage: mkdir [-h] [dossier]\nCrée un nouveau dossier.',
                'touch': 'Usage: touch [-h] [fichier]\nCrée un nouveau fichier.',
                'rm': 'Usage: rm [-h] [-r] [fichier|dossier]\nSupprime un fichier ou un dossier.',
                'chmod': 'Usage: chmod [-h] [permissions] [fichier|dossier]\nChange les permissions d\'un fichier ou d\'un dossier.',
                'cat': 'Usage: cat [-h] fichier...\nAffiche le contenu d\'un ou plusieurs fichiers.',
                'head': 'Usage: head [-h] [-n nombre] fichier...\nAffiche les premières lignes (10 par défaut).',
                'tail': 'Usage: tail [-h] [-n nombre] fichier...\nAffiche les dernières lignes (10 par défaut).',
                'nano': 'Usage: nano [-h] fichier\nOuvre un éditeur graphique pour modifier le fichier.',
                'man': 'Usage: man [commande]\nAffiche la documentation détaillée d\'une commande disponible dans cet environnement.'
            };
            return helpMessages[cmd] || `Commande inconnue : ${cmd}`;
        },
        manCommand(topic = '') {
            if (!topic) {
                this.output = 'Usage: man <commande>';
                return 'warning';
            }

            const manual = this.getManual(topic);
            if (!manual) {
                this.output = `Aucune page de manuel pour '${topic}'.`;
                return 'warning';
            }

            this.output = manual;
            return 'valid';
        },
        getManual(topic) {
            const manuals = {
                man: `
MAN(1)                             Commandes Shell                             MAN(1)

NOM
    man - affiche l'aide détaillée disponible dans ce simulateur.

SYNOPSIS
    man <commande>

DESCRIPTION
    Affiche une description, la syntaxe et les options implémentées ici pour la commande cible.

OPTIONS
    (aucune complémentaire)

REMARQUE
    Seules les commandes simulées disposent d'une page de manuel.
`,
                help: `
HELP(1)                            Commandes Shell                            HELP(1)

NOM
    help - liste l'ensemble des commandes supportées.

SYNOPSIS
    help [commande]

DESCRIPTION
    Sans argument, affiche toutes les commandes disponibles. Avec une commande,
    renvoie un bref rappel d'usage. Pour plus de détails, utilisez 'man <commande>'.
`,
                pwd: `
PWD(1)                             Commandes Shell                             PWD(1)

NOM
    pwd - imprime le chemin absolu du répertoire courant.

SYNOPSIS
    pwd

OPTIONS
    (aucune)

REMARQUES
    Le chemin est calculé à partir de la racine simulée 'root'.
`,
                echo: `
ECHO(1)                            Commandes Shell                            ECHO(1)

NOM
    echo - affiche une ligne de texte.

SYNOPSIS
    echo <texte>

DESCRIPTION
    Renvoie exactement les arguments fournis.
`,
                cd: `
CD(1)                              Commandes Shell                              CD(1)

NOM
    cd - change le répertoire courant.

SYNOPSIS
    cd [chemin]

OPTIONS
    .   répertoire courant
    ..  répertoire parent
    /   chemins absolus à partir de root

REMARQUES
    Nécessite l'exécution (x) sur chaque dossier traversé.
`,
                ls: `
LS(1)                              Commandes Shell                              LS(1)

NOM
    ls - liste le contenu d'un dossier.

SYNOPSIS
    ls [-a] [-l] [chemin]

OPTIONS
    -a  inclut les fichiers cachés
    -l  vue détaillée (droits, propriétaire, date)

REMARQUES
    Le chemin peut être relatif ou absolu. Requiert les droits r+x sur la cible.
`,
                mkdir: `
MKDIR(1)                           Commandes Shell                           MKDIR(1)

NOM
    mkdir - crée un ou plusieurs dossiers.

SYNOPSIS
    mkdir [-p] dossier...

OPTIONS
    -p  crée les dossiers parents manquants sans erreur si existants

REMARQUES
    Vérifie les droits w+x sur chaque dossier parent modifié.
`,
                touch: `
TOUCH(1)                           Commandes Shell                           TOUCH(1)

NOM
    touch - crée un fichier vide ou met à jour sa date.

SYNOPSIS
    touch fichier...

OPTIONS
    (implémentation simplifiée : -a/-m acceptés mais effectuent la même mise à jour de date)

REMARQUES
    Crée les fichiers inexistants dans le répertoire cible si les droits w+x sont présents.
`,
                cat: `
CAT(1)                             Commandes Shell                             CAT(1)

NOM
    cat - lit et affiche le contenu de fichiers.

SYNOPSIS
    cat fichier...

DESCRIPTION
    Imprime les fichiers fournis dans l'ordre. La sortie peut être redirigée avec
    '>' ou '>>' pour écrire dans un autre fichier stocké en mémoire.

LIMITES
    Chaque fichier de cette simulation est plafonné à 40 Mo.
`,
                head: `
HEAD(1)                            Commandes Shell                            HEAD(1)

NOM
    head - affiche le début d'un fichier.

SYNOPSIS
    head [-n nombre] fichier...

DESCRIPTION
    Retourne les premières lignes de chaque fichier (10 par défaut).
    Accepte '-n 25' ou '-n25' pour personnaliser le nombre de lignes.
`,
                tail: `
TAIL(1)                            Commandes Shell                            TAIL(1)

NOM
    tail - affiche la fin d'un fichier.

SYNOPSIS
    tail [-n nombre] fichier...

DESCRIPTION
    Retourne les dernières lignes de chaque fichier (10 par défaut).
    Accepte '-n 25' ou '-n25' pour personnaliser le nombre de lignes.
`,
                nano: `
NANO(1)                            Commandes Shell                            NANO(1)

NOM
    nano - édite un fichier texte dans une fenêtre dédiée.

SYNOPSIS
    nano fichier

DESCRIPTION
    Ouvre un éditeur graphique simulé affichant le contenu du fichier et
    permet de modifier puis enregistrer le texte. Les fichiers dépassant
    40 Mo ne sont pas supportés.

REMARQUES
    Le fichier est créé s'il n'existe pas, sous réserve de permissions suffisantes.
`,
                rm: `
RM(1)                              Commandes Shell                              RM(1)

NOM
    rm - supprime fichiers ou dossiers.

SYNOPSIS
    rm [-r] [-f] [-i] motif...

OPTIONS
    -r  supprime récursivement les dossiers
    -f  ignore les erreurs et confirmations
    -i  demande confirmation pour chaque élément (désactivé si -f)

REMARQUES
    Les motifs utilisent '*' pour la correspondance générique. Requiert w+x sur le dossier parent.
`,
                chmod: `
CHMOD(1)                           Commandes Shell                           CHMOD(1)

NOM
    chmod - modifie les permissions d'un fichier ou dossier.

SYNOPSIS
    chmod [-R] mode cible...

MODES
    Numérique : 755, 644...
    Symbolique : u+r, g-w, a=rw, u+rwx,g+rx,o-r...
    Plusieurs segments séparés par des virgules sont pris en charge.

OPTIONS
    -R  applique la modification récursivement aux sous-dossiers/fichiers.

REMARQUES
    Seul le propriétaire peut modifier les permissions dans cette simulation.
`
            };

            return manuals[topic];
        },
        echo(params = []){
            const segments = Array.isArray(params) ? params : (params ? [params] : []);
            if (!segments.length) {
                this.output = '';
                return '';
            }
            const args = [...segments];
            let interpret = false;

            while (args.length && args[0] === '-e') {
                interpret = true;
                args.shift();
            }

            const message = args.join(' ');
            const finalMessage = interpret ? this.interpretEscapeSequences(message) : message;
            this.output = finalMessage;
            const truncatedMessage = this.truncateText(finalMessage, 300);
            if (truncatedMessage) {
                this.showRobotTooltipMessage(truncatedMessage, {
                    duration: 2800,
                    auto: true,
                    type: 'default',
                    icon: 'mdi-message-text-outline',
                });
                this.playSoundEffect('beep');
            }
            return finalMessage;
        },
        pathWayDirectory(){//pwd
            this.output = this.getPath(this.currentNode).replace("root", "");
            
            if(this.output=="")
                this.output="/"
            
            this.pwd = this.output;
            this.refreshTreeView(this.currentNode, { signal: false });
        },
        changeDirectory(params, options = {}) {//cd
            const silent = !!(options && options.silent);
            const previousNode = this.currentNode;
            let _dirName = ""
            if(typeof params == "object")//params
                _dirName = params[0];
            else//path
                _dirName = params;

            function closeChilds(node){
                if (node.children) {
                    for (let index = 0; index < node.children.length; index++) {
                        const element = node.children[index];

                        closeChilds(element)
                    }
                    // node._children = node.children;
                    node.children = null;
                }
                else if(node._children){
                    for (let index = 0; index < node._children.length; index++) {
                        const element = node._children[index];

                        closeChilds(element)
                    }
                }
            }
            
            this.cDirect.from = this.currentNode.data.name;
            

            if(!_dirName){
                this.currentNode = this.root;
                closeChilds(this.currentNode)
                this.changeDirectory("home/user", options)
                this.cDirect.to = this.currentNode.data.name;
                if (!silent) {
                    this.output = `Deplacement vers le dossier personnel (par default) : ${this.currentNode.data.name}`;
                }
                this.refreshTreeView(this.currentNode, { signal: !silent });
                return "valid";
            }
            else if(_dirName=='/'){

                // closed
                if (this.currentNode.children) {
                    if(!this.currentNode._children)
                        this.currentNode._children = this.currentNode.children;
                    // this.currentNode._children = this.currentNode.children;
                    this.currentNode.children = null;
                    console.log("closed", this.currentNode._children);
                    
                }

                this.currentNode = this.root;
                
                this.cDirect.to = this.currentNode.data.name;

                // closed if opened
                closeChilds(this.currentNode)
                // this.currentNode.children?.forEach((child) => {
                //     console.log("opensls ls");
                //     if (child.children) {
                //         child._children = child.children;
                //         child.children = null;
                //     }
                // });
            }
            else {
                if( _dirName[0] == '/' ){
                    
                    this.currentNode = this.root;
                    closeChilds(this.currentNode)
                }
                const _dirNames = _dirName.split("/")

                
                for (let index = 0; index < _dirNames.length; index++) {
                    const dirName = _dirNames[index];

                    if(dirName != ""){
                        if (dirName === '.') {
                            continue;
                        }
                        if (dirName === '..' && this.currentNode && this.currentNode != this.root) {
                            if (!this.hasPermission(this.currentNode.parent, 'x')) {
                                this.output = `Permissions non accordées pour accéder au dossier parent '${this.currentNode.parent.data.name}'.`;
                                return 'warning';
                            }
                            if (this.currentNode.parent.children) {
                                this.currentNode.parent.children.forEach((child) => {
                                    if (child.children) {
                                        // child._children = child.children;
                                        child.children = null;
                                    }
                                });
                                // this.currentNode.parent._children = this.currentNode.parent.children;
                                this.currentNode.parent.children = null;
                            }
                            this.currentNode = this.currentNode.parent;
                        } 
                        else if( ! (dirName === '..' && this.currentNode) ) {
                            const found = this.currentNode.children?.find((d) => d.data.name === dirName && d.data.type == "d") || this.currentNode._children?.find((d) => d.data.name === dirName &&  d.data.type == "d");

                            
                            if (found) {
                                if (!this.hasPermission(found, 'x')) {
                                    this.output = `Permissions non accordées pour accéder au dossier '${found.data.name}'.`;
                                    return 'warning';
                                }
                                if (this.currentNode._children && !this.currentNode.children) {
                                    this.currentNode.children = this.currentNode._children;
                                    // this.currentNode._children = null;
                                }
                                found.children?.forEach((child) => {
                                    if (child.children) {
                                        child._children = child.children;
                                        child.children = null;
                                    }
                                });
                                this.currentNode = found;
                            } 
                            else {
                                this.output = `Dossier non trouvé : ${dirName}`;
                                return 'warning';
                            }
                        }
                    }
                }
            }

            this.cDirect.to = this.currentNode.data.name;
            // console.log("cd:", this.cDirect);

            if (!silent) {
                this.pwd = ""
                this.output = `Dossier actuel : ${this.currentNode.data.name}`;
                this.createOutputAnimate()
                this.trackDirectoryVisit(this.getPath(this.currentNode));
            } else if (!this.pwd) {
                const normalized = this.getPath(this.currentNode).replace("root", "") || "/";
                this.pwd = normalized;
            }
            this.refreshTreeView(this.currentNode, { signal: !silent });
            if (!silent) {
                this.$nextTick(() => {
                    this.animateTreePath(previousNode, this.currentNode);
                });
            }
            return 'valid'
        },
        findChildGlobal(root, node) {
            const name = node?.data?.name ? node.data.name : node.name;
            const depth = node?.depth || 0;

            if (root?.data?.name === name && root.depth == depth) {
                return root;
            }

            const children = root?.children || root?._children || [];
            for (let child of children) {
                if (child.data.name === name && child.depth == depth) {
                    return child;
                }

                const found = this.findChildGlobal(child, node);
                if (found) return found;
            }

            return null;
        },
        findChild(node, name) {
            if (node?.data?.name === name) {
                return node;
            }

            const children = node?.children || node?._children || [];
            for (let child of children) {
                if (child.data.name === name) {
                    return child;
                }

                const found = findChild(child, name);
                if (found) return found;
            }

            return null;
        },
        listDirectory(params) {//ls
            const args = Array.isArray(params) ? params : (params ? [params] : []);
            // Vérifie les options `-a` et `-l` dans les paramètres
            const showHidden = args.some((p) => /-[^ ]*a[^ ]*/.test(p));
            const detailedView = args.some((p) => /-[^ ]*l[^ ]*/.test(p));

            // Met à jour les options de la commande `ls` pour la partie graphique
            this.ls.showHidden = showHidden;

            // Récupère le chemin sans options
            const nonOptionParams = args.filter((p) => !/-[^ ]*/.test(p));
            const dirPath = nonOptionParams[0] || "";

            // Résout le chemin (si le chemin est vide, on utilise le dossier courant)
            const targetNode = dirPath ? this.resolvePath(dirPath) : this.currentNode;

            if (!targetNode) {
                this.output = `Erreur : Répertoire '${dirPath}' introuvable.`;
                return;
            }

            // Détecte si on liste un dossier parent (dans ce cas on ne touche pas au Tree)
            const isParentListing =
                !!dirPath &&
                targetNode !== this.currentNode &&
                this.isPathToCurrentNode(targetNode);

            // Vérifie les permissions de lecture
            if (!this.hasPermission(targetNode, ['r', 'x'])) {
                this.output = "Permissions non accordées pour lire ce dossier.";
                return;
            }

            let beforChild = targetNode.children;
            // Prépare les enfants à afficher
            let nodeChildren;
            if (isParentListing) {
                nodeChildren = targetNode.children || targetNode._children || [];
            } 
            else {
                targetNode.children = targetNode._children || targetNode.children || [];
                nodeChildren = targetNode.children;
            }

            // // Filtre les fichiers cachés si `-a` n'est pas spécifié
            const children = showHidden
                ? nodeChildren
                : nodeChildren.filter((child) => !child.data.hidden);

            if (!isParentListing) {
                targetNode.children = children;
            }
            
            // Génère la sortie
            if (children.length === 0) {
                this.output = "Dossier vide";
                targetNode.children = beforChild;
                return;
            } 
            else if (detailedView) {
                // Vue détaillée avec `-l`
                this.output = children
                    .map(
                        (child) =>
                            `${child.data.rights} ${child.data.user} ${child.data.group} ${child.data.date} ${child.data.name}`.replaceAll(" ", "&nbsp;")
                    )
                    .join("\n");
            } 
            else {
                // Vue simple
                this.output = children.map((child) => child.data.name).join("\n");
            }

            // console.log("-----", this.currentNode, targetNode, children);

            // Met à jour l'arbre uniquement si l'on parcourt le répertoire courant ou un sous-dossier
            if (!isParentListing && children.length > 0) {
                this.refreshTreeView(this.currentNode);
            }
        },
        makeDirectory(params) {//mkdir
            if (!params) {
                this.output = 'Nom de dossier requis';
                return;
            }

            const args = Array.isArray(params) ? params : [params];
            const options = args.filter((arg) => arg.startsWith('-'));
            const dirNames = args.filter((arg) => !arg.startsWith('-'));

            if (!dirNames.length) {
                this.output = 'Aucun nom de dossier fourni';
                return 'error';
            }

            const allowParents = options.some((opt) => opt.includes('p'));
            const createdDirs = [];
            const errors = [];

            for (const rawPath of dirNames) {
                if (!rawPath || rawPath === '.' || rawPath === '/') {
                    errors.push(`mkdir: chemin invalide '${rawPath || ''}'`);
                    continue;
                }

                const segments = rawPath.split('/');
                let current = rawPath.startsWith('/') ? this.root : this.currentNode;
                let failed = false;

                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    if (!segment || segment === '.') {
                        continue;
                    }

                    if (segment === '..') {
                        if (current.parent) {
                            current = current.parent;
                        }
                        continue;
                    }

                    const isLast = i === segments.length - 1;
                    const existing = this.getChildNode(current, segment);

                    if (existing) {
                        if (existing.data.type !== 'd') {
                            errors.push(`mkdir: impossible de créer le dossier '${rawPath}': Un fichier porte déjà ce nom`);
                            failed = true;
                            break;
                        }

                        if (isLast && !allowParents) {
                            errors.push(`mkdir: impossible de créer le dossier '${rawPath}': Le fichier existe`);
                            failed = true;
                            break;
                        }

                        current = existing;
                        continue;
                    }

                    if (!isLast && !allowParents) {
                        errors.push(`mkdir: impossible de créer le dossier '${rawPath}': Chemin intermédiaire manquant`);
                        failed = true;
                        break;
                    }

                    if (!this.hasPermission(current, ['w', 'x'])) {
                        this.output = `Permissions non accordées pour créer un dossier dans '${current.data.name}'.`;
                        return 'warning';
                    }

                    current = this.createDirectoryNode(current, segment);
                }

                if (!failed) {
                    createdDirs.push(rawPath);
                }
            }

            if (createdDirs.length) {
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
                this.output = `Dossier(s) créé(s) : ${createdDirs.join(', ')}`;
                if (errors.length) {
                    this.output += ` | ${errors.join(' | ')}`;
                }
                this.stats.createdDirectory = true;
                this.checkBadges();
                return 'valid';
            }

            this.output = errors.join(' | ') || 'Aucun dossier créé';
            return errors.length ? 'warning' : 'valid';
        },
        createFile(params) {//touch
            if (!params) {
                this.output = 'Nom de fichier requis';
                return;
            }

            const args = Array.isArray(params) ? params : [params];
            const options = args.filter((arg) => arg.startsWith('-'));
            const files = args.filter((arg) => !arg.startsWith('-'));

            if (!files.length) {
                this.output = 'Aucun fichier spécifié';
                return;
            }

            const updateAccess = options.some((opt) => opt.includes('a'));
            const updateModify = options.some((opt) => opt.includes('m'));

            const created = [];
            const updated = [];
            const errors = [];

            for (const filePath of files) {
                const targetInfo = this.getNodeFromPath(filePath, { stopBeforeLast: true, includeFiles: true });
                if (!targetInfo || !targetInfo.targetName) {
                    errors.push(`touch: chemin invalide '${filePath}'`);
                    continue;
                }

                const parentNode = targetInfo.node;
                const fileName = targetInfo.targetName;
                const existing = this.getChildNode(parentNode, fileName);

                if (existing) {
                    if (existing.data.type === 'd') {
                        errors.push(`touch: '${filePath}' est un dossier`);
                        continue;
                    }

                    if (!this.hasPermission(existing, 'w')) {
                        errors.push(`touch: permissions insuffisantes pour modifier '${filePath}'`);
                        continue;
                    }

                    existing.data.date = this.getFormattedDate();
                    updated.push(filePath);
                    continue;
                }

                if (!this.hasPermission(parentNode, ['w', 'x'])) {
                    errors.push(`touch: permissions insuffisantes dans '${parentNode.data.name}'`);
                    continue;
                }

                this.createFileNode(parentNode, fileName);
                created.push(filePath);
            }

            if (created.length || updated.length) {
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
                const messages = [];
                if (created.length) {
                    messages.push(`Fichier(s) créé(s) : ${created.join(', ')}`);
                }
                if (updated.length) {
                    messages.push(`Horodatage mis à jour : ${updated.join(', ')}`);
                }
                if (errors.length) {
                    messages.push(errors.join(' | '));
                }
                this.output = messages.join(' | ');
                if (created.length) {
                    this.stats.createdFile = true;
                    this.checkBadges();
                }
                return;
            }

            this.output = errors.join(' | ') || 'Aucun fichier traité';
        },
        catCommand(params = []) {
            const args = Array.isArray(params)
                ? params.filter((arg) => typeof arg === 'string' && arg.trim() !== '')
                : (params ? [params] : []);
            if (!args.length) {
                this.output = 'cat: indique au moins un fichier.';
                return { state: 'warning', stdout: '' };
            }

            const outputs = [];
            const errors = [];
            let successCount = 0;

            for (const filePath of args) {
                const targetPath = filePath;
                const nodeInfo = this.getNodeFromPath(targetPath, { includeFiles: true });
                const fileNode = nodeInfo?.node;

                if (!fileNode || fileNode.data.type !== 'f') {
                    errors.push(`cat: ${targetPath}: fichier introuvable`);
                    continue;
                }

                if (!this.hasPermission(fileNode, 'r')) {
                    errors.push(`cat: ${targetPath}: permission refusée`);
                    continue;
                }

                successCount += 1;
                const fileContent = typeof fileNode.data.content === 'string' ? fileNode.data.content : '';
                outputs.push(fileContent);
            }

            const stdout = outputs.join(outputs.length > 1 ? '\n' : '') || '';
            const errorText = errors.join(' | ');
            if (errorText && stdout) {
                this.output = `${stdout}\n${errorText}`;
            } else {
                this.output = stdout || errorText;
            }

            const resultState = errors.length
                ? (successCount > 0 ? 'warning' : 'error')
                : 'valid';

            return { state: resultState, stdout, stderr: errorText };
        },
        parseLineCountOption(params = [], commandName = 'head', defaultCount = 10) {
            const args = Array.isArray(params)
                ? params.filter((arg) => typeof arg === 'string' && arg.trim() !== '')
                : (typeof params === 'string' && params.trim() !== '' ? [params] : []);
            const result = {
                count: defaultCount,
                files: [],
                error: '',
            };

            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg === '-n') {
                    const next = args[i + 1];
                    if (next === undefined) {
                        result.error = `${commandName}: l'option -n requiert une valeur.`;
                        break;
                    }
                    const parsed = parseInt(next, 10);
                    if (!Number.isFinite(parsed) || parsed < 0) {
                        result.error = `${commandName}: valeur invalide '${next}' pour -n.`;
                        break;
                    }
                    result.count = parsed;
                    i += 1;
                    continue;
                }
                if (arg.startsWith('-n') && arg.length > 2) {
                    const value = arg.slice(2);
                    const parsed = parseInt(value, 10);
                    if (!Number.isFinite(parsed) || parsed < 0) {
                        result.error = `${commandName}: valeur invalide '${value}' pour -n.`;
                        break;
                    }
                    result.count = parsed;
                    continue;
                }
                result.files.push(arg);
            }

            return result;
        },
        headCommand(params = []) {
            const parsed = this.parseLineCountOption(params, 'head');
            if (parsed.error) {
                this.output = parsed.error;
                return { state: 'error', stdout: '', stderr: parsed.error };
            }
            if (!parsed.files.length) {
                const msg = 'head: indique au moins un fichier.';
                this.output = msg;
                return { state: 'warning', stdout: '', stderr: msg };
            }
            return this.processFileLineOutput({
                files: parsed.files,
                count: parsed.count,
                commandName: 'head',
                mode: 'head',
            });
        },
        tailCommand(params = []) {
            const parsed = this.parseLineCountOption(params, 'tail');
            if (parsed.error) {
                this.output = parsed.error;
                return { state: 'error', stdout: '', stderr: parsed.error };
            }
            if (!parsed.files.length) {
                const msg = 'tail: indique au moins un fichier.';
                this.output = msg;
                return { state: 'warning', stdout: '', stderr: msg };
            }
            return this.processFileLineOutput({
                files: parsed.files,
                count: parsed.count,
                commandName: 'tail',
                mode: 'tail',
            });
        },
        handleNanoCommand(params = []) {
            const args = Array.isArray(params)
                ? params.filter((arg) => typeof arg === 'string' && arg.trim() !== '')
                : (params ? [params] : []);
            if (!args.length) {
                this.output = 'nano: indique un fichier à éditer.';
                return 'warning';
            }
            const targetPath = args[0];
            const fileLookup = this.getNodeFromPath(targetPath, { includeFiles: true });
            let fileNode = fileLookup?.node;

            if (fileNode && fileNode.data.type === 'd') {
                this.output = `nano: '${targetPath}' est un dossier.`;
                return 'error';
            }

            if (!fileNode) {
                const parentInfo = this.getNodeFromPath(targetPath, { stopBeforeLast: true, includeFiles: true });
                if (!parentInfo || !parentInfo.node || !parentInfo.targetName) {
                    this.output = `nano: chemin invalide '${targetPath}'.`;
                    return 'error';
                }
                if (!this.hasPermission(parentInfo.node, ['w', 'x'])) {
                    this.output = `nano: permissions insuffisantes dans '${parentInfo.node.data.name}'.`;
                    return 'error';
                }
                fileNode = this.createFileNode(parentInfo.node, parentInfo.targetName);
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
                this.stats.createdFile = true;
                this.checkBadges();
            } else if (!this.hasPermission(fileNode, ['r', 'w'])) {
                this.output = `nano: permissions insuffisantes pour éditer '${targetPath}'.`;
                return 'error';
            }

            const fileContent = typeof fileNode.data.content === 'string' ? fileNode.data.content : '';
            this.openNanoEditor(targetPath, fileContent);
            this.output = `nano: édition ouverte pour '${targetPath}'.`;
            return 'valid';
        },
        openNanoEditor(filePath, content = '') {
            this.nanoEditor.filePath = filePath;
            this.nanoEditor.content = content;
            this.nanoEditor.originalContent = content;
            this.nanoEditor.error = '';
            this.nanoEditor.show = true;
        },
        closeNanoEditor() {
            this.nanoEditor.show = false;
            this.nanoEditor.error = '';
            this.nanoEditor.filePath = '';
            this.nanoEditor.content = '';
            this.nanoEditor.originalContent = '';
            this.$nextTick(() => this.focusCommandInput());
        },
        saveNanoEditor() {
            if (!this.nanoEditor.filePath) {
                this.nanoEditor.error = 'Aucun fichier à sauvegarder.';
                return;
            }
            const targetPath = this.nanoEditor.filePath;
            const buffer = this.nanoEditor.content;
            const writeResult = this.writeFileContent(targetPath, buffer, { append: false });
            if (!writeResult.ok) {
                this.nanoEditor.error = writeResult.message;
                return;
            }
            if (writeResult.created) {
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
                this.stats.createdFile = true;
                this.checkBadges();
            }
            this.nanoEditor.error = '';
            this.closeNanoEditor();
            this.output = `nano: '${targetPath}' sauvegardé (${this.getByteLength(buffer)} octets).`;
        },
        processFileLineOutput({ files = [], count = 10, commandName = 'head', mode = 'head' }) {
            const outputs = [];
            const errors = [];
            let successCount = 0;
            const useHeaders = files.length > 1;
            const safeCount = Number.isFinite(count) && count >= 0 ? count : 10;

            files.forEach((filePath) => {
                const nodeInfo = this.getNodeFromPath(filePath, { includeFiles: true });
                const fileNode = nodeInfo?.node;
                if (!fileNode || fileNode.data.type !== 'f') {
                    errors.push(`${commandName}: ${filePath}: fichier introuvable`);
                    return;
                }
                if (!this.hasPermission(fileNode, 'r')) {
                    errors.push(`${commandName}: ${filePath}: permission refusée`);
                    return;
                }

                successCount += 1;
                const rawContent = typeof fileNode.data.content === 'string' ? fileNode.data.content : '';
                const normalized = rawContent.replace(/\r\n/g, '\n');
                let lines = normalized.split('\n');
                if (lines.length === 1 && lines[0] === '') {
                    lines = [];
                }

                let selected = [];
                if (mode === 'head') {
                    selected = lines.slice(0, safeCount);
                } else { // tail
                    selected = safeCount === 0 ? [] : lines.slice(-safeCount);
                }

                const block = selected.join('\n');
                if (useHeaders) {
                    outputs.push(`==> ${filePath} <==`);
                }
                outputs.push(block);
            });

            const stdout = outputs.join(outputs.length > 0 ? '\n' : '');
            const errorText = errors.join(' | ');
            if (errorText && stdout) {
                this.output = `${stdout}\n${errorText}`;
            } else {
                this.output = stdout || errorText;
            }

            const resultState = errors.length
                ? (successCount > 0 ? 'warning' : 'error')
                : 'valid';

            return { state: resultState, stdout, stderr: errorText };
        },
        applyOutputRedirection(redirection, payload) {
            const normalizedPayload = typeof payload === 'string' ? payload : '';
            const writeResult = this.writeFileContent(redirection.target, normalizedPayload, {
                append: redirection.append,
            });

            if (!writeResult.ok) {
                this.output = writeResult.message;
                return 'error';
            }

            if (writeResult.created) {
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
                this.stats.createdFile = true;
                this.checkBadges();
            }

            const targetLabel = writeResult.path || redirection.target;
            const charCount = normalizedPayload.length;
            const label = charCount > 1 ? 'caractères' : 'caractère';
            this.output = `Redirection: ${redirection.append ? 'ajouté' : 'écrit'} ${charCount} ${label} dans '${targetLabel}'.`;
            return 'valid';
        },
        writeFileContent(targetPath, rawContent, options = {}) {
            const normalizedPath = (targetPath || '').trim();
            if (!normalizedPath) {
                return { ok: false, message: 'Redirection: aucun fichier cible indiqué.' };
            }

            const context = this.getNodeFromPath(normalizedPath, { stopBeforeLast: true, includeFiles: true });
            if (!context || !context.node || !context.targetName) {
                return { ok: false, message: `Redirection: chemin invalide '${normalizedPath}'.` };
            }

            const content = typeof rawContent === 'string' ? rawContent : (rawContent ?? '').toString();
            const parentNode = context.node;
            const fileName = context.targetName;
            let fileNode = this.getChildNode(parentNode, fileName);
            const appendMode = !!options.append;
            const existingContent = fileNode && typeof fileNode.data.content === 'string'
                ? fileNode.data.content
                : '';
            const newContent = appendMode ? (existingContent + content) : content;

            if (fileNode && fileNode.data.type === 'd') {
                return { ok: false, message: `Redirection: '${normalizedPath}' est un dossier.` };
            }

            if (fileNode && !this.hasPermission(fileNode, 'w')) {
                return { ok: false, message: `Redirection: permissions insuffisantes pour '${normalizedPath}'.` };
            }

            if (!fileNode && !this.hasPermission(parentNode, ['w', 'x'])) {
                return { ok: false, message: `Redirection: permissions insuffisantes dans '${parentNode.data.name}'.` };
            }

            const nextSize = this.getByteLength(newContent);
            const limitLabel = `${Math.round(this.maxFileSizeBytes / (1024 * 1024))} Mo`;
            if (nextSize > this.maxFileSizeBytes) {
                return {
                    ok: false,
                    message: `Redirection: taille maximale de ${limitLabel} dépassée pour '${normalizedPath}'.`,
                };
            }

            let created = false;
            if (!fileNode) {
                fileNode = this.createFileNode(parentNode, fileName);
                created = true;
            }

            fileNode.data.content = newContent;
            fileNode.data.date = this.getFormattedDate();

            return { ok: true, created, node: fileNode, path: normalizedPath };
        },
        getByteLength(value) {
            if (!value) {
                return 0;
            }
            return new TextEncoder().encode(value).length;
        },
        interpretEscapeSequences(value = '') {
            let result = '';
            for (let i = 0; i < value.length; i++) {
                const char = value[i];
                if (char === '\\' && i + 1 < value.length) {
                    const next = value[i + 1];
                    i += 1;
                    switch (next) {
                        case 'n':
                            result += '\n';
                            break;
                        case 't':
                            result += '\t';
                            break;
                        case 'r':
                            result += '\r';
                            break;
                        case '0':
                            result += '\0';
                            break;
                        case '\\':
                            result += '\\';
                            break;
                        case '"':
                            result += '"';
                            break;
                        default:
                            result += next;
                            break;
                    }
                } else {
                    result += char;
                }
            }
            return result;
        },
        removeItem(params) {//rm
            const args = Array.isArray(params) ? params : (params ? [params] : []);
            if (!args.length) {
                this.output = 'Erreur : Aucun nom spécifié';
                return;
            }

            const options = args.filter((arg) => arg.startsWith('-'));
            const targets = args
                .filter((arg) => !arg.startsWith('-'))
                .map((arg) => arg.endsWith('/') && arg.length > 1 ? arg.replace(/\/+$/, '') : (arg === '/' ? arg : arg.replace(/\/+$/, '')));
            if (!targets.length) {
                this.output = 'Erreur : Aucun fichier ou dossier à supprimer';
                return;
            }

            if (!this.hasPermission(this.currentNode, ['w', 'x'])) {
                this.output = `Permissions non accordées pour modifier le contenu de '${this.currentNode.data.name}'.`;
                return;
            }

            const recursive = options.some((opt) => opt.includes('r'));
            const force = options.some((opt) => opt.includes('f'));
            const interactive = !force && options.some((opt) => opt.includes('i'));
            const children = this.currentNode.children || this.currentNode._children || [];

            const escapeRegex = (str) =>
                str.replace(/([.+?^${}()|[\]\\])/g, '\\$1');
            const globToRegex = (pattern) => {
                const escaped = escapeRegex(pattern);
                return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
            };

            function remove(tree, child){
                if(tree?.name == child.parent.data.name && tree?.date == child.parent?.data.date){
                    const index = tree.children?.findIndex((_child) => _child.name === child.data.name);
                    if (index > -1) {
                        tree.children.splice(index, 1);
                    }
                    return;
                }
                else{
                    if(tree?.children){
                        for (let index = 0; index < tree?.children.length; index++) {
                            const element = tree.children[index];

                            remove(element, child)
                        }
                    }
                }
            }

            const blockedDirs = new Set();
            const deniedItems = new Set();
            const skippedInteractive = new Set();
            const toDelete = [];
            let removedDirectoryRecursive = false;
            targets.forEach((pattern) => {
                const regex = globToRegex(pattern === '' ? '*' : pattern);
                children.forEach((child) => {
                    if (!regex.test(child.data.name)) return;

                    if (child.data.type === 'd' && !recursive) {
                        blockedDirs.add(child.data.name);
                        return;
                    }

                    if (child.data.type === 'd' && recursive && !this.hasPermission(child, 'x')) {
                        deniedItems.add(child.data.name);
                        return;
                    }

                     if (child.data.type === 'd' && recursive) {
                        removedDirectoryRecursive = true;
                    }

                    if (!toDelete.includes(child)) {
                        toDelete.push(child);
                    }
                });
            });

            if (!toDelete.length) {
                if (blockedDirs.size && !force) {
                    this.output = `Utilisez l'option -r pour supprimer les dossiers : ${Array.from(blockedDirs).join(', ')}`;
                }
                else if (deniedItems.size && !force) {
                    this.output = `Permissions insuffisantes pour supprimer : ${Array.from(deniedItems).join(', ')}`;
                }
                else if (!force) {
                    this.output = `Erreur : Aucun élément correspondant à '${targets.join(', ')}'`;
                }
                else {
                    this.output = '';
                }
                return;
            }

            const deletedList = [];
            toDelete.forEach((child) => {
                if (interactive && typeof window !== 'undefined') {
                    const confirmDelete = window.confirm(`Supprimer '${child.data.name}' ?`);
                    if (!confirmDelete) {
                        skippedInteractive.add(child.data.name);
                        return;
                    }
                }
                remove(this.folderTreeData, child);
                const idx = children.findIndex((c) => c === child);
                if (idx > -1) {
                    children.splice(idx, 1);
                }
                deletedList.push(child.data.name);
            });

            this.refreshTreeView(this.currentNode);
            const deletedNames = deletedList.join(', ');
            let extraInfo = '';
            if (blockedDirs.size) {
                extraInfo += ` | Dossiers ignorés (ajoutez -r) : ${Array.from(blockedDirs).join(', ')}`;
            }
            if (deniedItems.size) {
                extraInfo += ` | Accès refusé : ${Array.from(deniedItems).join(', ')}`;
            }
            if (skippedInteractive.size) {
                extraInfo += ` | Ignoré (option -i) : ${Array.from(skippedInteractive).join(', ')}`;
            }
            const base = deletedNames ? `Élément(s) supprimé(s) : ${deletedNames}` : 'Aucun élément supprimé';
            this.output = `${base}${extraInfo}`;
            if (removedDirectoryRecursive) {
                this.stats.removedDirectory = true;
                this.checkBadges();
            }
        },
        getPath(node) {
            if (node.parent) {
                return `${this.getPath(node.parent)}/${node.data.name}`;
            }
            return node.data.name;
        },
        handleChmod(params) {
            const args = Array.isArray(params) ? params : [params];
            if (!args.length) {
                this.output = 'Usage: chmod [options] mode fichier';
                return 'error';
            }

            this.chmodInfos.fileName = "";
            this.chmodInfos.rights = "----------";
            this.chmodInfos.data.user = [];
            this.chmodInfos.data.group = [];
            this.chmodInfos.data.other = [];

            const options = args.filter((arg) => arg.startsWith('-'));
            const rest = args.filter((arg) => !arg.startsWith('-'));

            if (rest.length < 2) {
                this.output = 'Erreur : préciser les permissions et au moins un fichier';
                return 'error';
            }

            const recursive = options.some((opt) => opt.includes('R'));
            const modeSpec = rest.shift();
            const isNumeric = /^[0-7]{3}$/.test(modeSpec);

            const symbolicSegments = !isNumeric ? modeSpec.split(',') : [];
            if (!isNumeric) {
                const validSymbolic = symbolicSegments.every((segment) => /^[ugoa]*[+-=][rwx]+$/.test(segment));
                if (!validSymbolic) {
                    this.output = 'Erreur : Format symbolique invalide';
                    return 'error';
                }
            }

            const updated = [];
            const missing = [];
            const denied = [];

            rest.forEach((targetPath) => {
                const resolved = this.getNodeFromPath(targetPath, { includeFiles: true });
                if (!resolved) {
                    missing.push(targetPath);
                    return;
                }

                const node = resolved.node;
                if (!this.isOwner(node)) {
                    denied.push(targetPath);
                    return;
                }

                this.applyChmodToNode(node, { modeSpec, isNumeric, symbolicSegments });
                if (recursive && node.data.type === 'd') {
                    this.applyChmodRecursive(node, { modeSpec, isNumeric, symbolicSegments }, denied);
                }

                this.chmodInfos.fileName = node.data.name;
                this.chmodInfos.rights = node.data.rights;
                this.buildRightsInfos();
                updated.push(targetPath);
            });

            if (updated.length) {
                this.preserveCurrentPath();
                this.createTree({ preserveSelection: true });
                this.emitTreeSignal();
            }

            const messages = [];
            if (updated.length) {
                messages.push(`Permissions mises à jour pour : ${updated.join(', ')}`);
            }
            if (missing.length) {
                messages.push(`Introuvable : ${missing.join(', ')}`);
            }
            if (denied.length) {
                messages.push(`Accès refusé : ${denied.join(', ')}`);
            }

            this.output = messages.join(' | ') || 'Aucune mise à jour effectuée';
            if (!updated.length) {
                return 'warning';
            }
            return 'valid';
        },
        applyChmodToNode(node, { modeSpec, isNumeric, symbolicSegments }) {
            if (isNumeric) {
                let permStr = this.convertNumericPermissions(modeSpec);
                node.data.rights = permStr;
                node.data.rights = node.data.type.replace("f", "-") + node.data.rights.slice(1);
                node.rights = node.data.rights;
                return;
            }

            let rights = node.data.rights;
            symbolicSegments.forEach((segment) => {
                rights = this.applySymbolicPermissions(rights, segment);
            });
            node.data.rights = node.data.type.replace("f", "-") + rights.slice(1);
            node.rights = node.data.rights;
        },
        applyChmodRecursive(node, format, denied) {
            const stack = [...(node.children || node._children || [])];
            while (stack.length) {
                const current = stack.pop();
                if (!this.isOwner(current)) {
                    denied.push(this.getPath(current).replace('root', '') || current.data.name);
                    continue;
                }
                this.applyChmodToNode(current, format);
                if (current.data.type === 'd') {
                    const nextChildren = current.children || current._children || [];
                    stack.push(...nextChildren);
                }
            }
        },
        convertNumericPermissions(numeric) {
            const permissionMap = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];

            return `d${permissionMap[numeric[0]]}${permissionMap[numeric[1]]}${permissionMap[numeric[2]]}`;
        },
        applySymbolicPermissions(currentRights, symbolic) {
            let [owner, group, other] = currentRights.slice(1).match(/.{3}/g); // Obtenir les permissions

            // decomposition de la commande
            const match = symbolic.match(/^([ugoa]+)([+-=])([rwx]+)$/);
            if (!match) {
                return currentRights;
            }
            const [, entities, operation, modes] = match;


            // appliquer la modification aux entités concernées
            for (const entity of entities) {

                switch (entity) {
                    case 'u': owner = this.updateRights(owner, operation, modes); break;
                    case 'g': group = this.updateRights(group, operation, modes); break;
                    case 'o': other = this.updateRights(other, operation, modes); break;
                    case 'a':
                        owner = this.updateRights(owner, operation, modes);
                        group = this.updateRights(group, operation, modes);
                        other = this.updateRights(other, operation, modes);
                        break;
                }
            }

            return `d${owner}${group}${other}`;
        },
        updateRights(current, operation, modes) {
            let updated = current;
            
            for (const mode of modes) {

                let position = "rwx".indexOf(mode)
                switch (operation) {
                    case '+':
                        if (!updated.includes(mode)) 
                            updated = updated.slice(0, position) + mode + updated.slice(position + 1);
                        break;
                    case '-':
                        updated = updated.replace(mode, '-');
                        break;
                    case '=':
                        updated = mode;
                        break;
                }
            }

            // complete les caracteere
            // updated = updated.split('').sort().join('').padEnd(3, '-');

            return updated;
        },
        getFormattedDate() {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${String(now.getFullYear()).slice(2).padStart(2, '0')}-${month}-${day} ${hours}:${minutes}`;
        },
        ensureChildren(node) {
            if (node.children) {
                return node.children;
            }
            if (node._children) {
                node.children = node._children;
                return node.children;
            }
            node.children = [];
            return node.children;
        },
        getChildNode(node, name) {
            const children = node.children || node._children || [];
            return children.find((child) => child.data.name === name);
        },
        getDirectoryChild(node, name) {
            const child = this.getChildNode(node, name);
            if (child && child.data.type === 'd') {
                return child;
            }
            return null;
        },
        createDirectoryNode(parent, name) {
            const formattedDate = this.getFormattedDate();
            const dirData = {
                name,
                type: "d",
                rights: "drwxr-xr-x",
                user: this.currentUser,
                group: this.currentGroups[0] || this.currentUser,
                hidden: name[0] === '.',
                date: formattedDate,
                children: [],
            };
            if (!parent.data.children) {
                parent.data.children = [];
            }
            parent.data.children.push(dirData);

            const newNode = {
                data: dirData,
                parent,
                depth: (parent.depth || 0) + 1,
                children: [],
                _children: [],
            };
            const collection = this.ensureChildren(parent);
            collection.push(newNode);

            return newNode;
        },
        createFileNode(parent, name) {
            const formattedDate = this.getFormattedDate();
            const fileData = {
                name,
                type: "f",
                rights: "-rwxr-xr-x",
                user: this.currentUser,
                group: this.currentGroups[0] || this.currentUser,
                hidden: name[0] === '.',
                date: formattedDate,
                children: null,
                content: '',
            };
            if (!parent.data.children) {
                parent.data.children = [];
            }
            parent.data.children.push(fileData);

            const newNode = {
                data: fileData,
                parent,
                depth: (parent.depth || 0) + 1,
                children: null,
                _children: null,
            };
            const collection = this.ensureChildren(parent);
            collection.push(newNode);

            return newNode;
        },
        getNodeFromPath(path, options = {}) {
            const { stopBeforeLast = false, includeFiles = false } = options;
            if (path === undefined || path === null) {
                return null;
            }

            const isAbsolute = path.startsWith('/');
            let current = isAbsolute ? this.root : this.currentNode;
            const segments = path.split('/');
            let targetName = null;

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                if (!segment || segment === '.') {
                    continue;
                }

                if (segment === '..') {
                    if (current.parent) {
                        current = current.parent;
                    }
                    continue;
                }

                const isLast = i === segments.length - 1;
                if (stopBeforeLast && isLast) {
                    targetName = segment;
                    break;
                }

                const children = current.children || current._children || [];
                const found = children.find((child) => child.data.name === segment);

                if (!found) {
                    return null;
                }

                if (found.data.type === 'f' && (!includeFiles && !(isLast && !stopBeforeLast))) {
                    return null;
                }

                current = found;
            }

            if (stopBeforeLast) {
                return targetName ? { node: current, targetName } : null;
            }

            return { node: current };
        },
        getAutocompleteContext(param) {
            if (typeof param !== 'string') {
                return null;
            }

            let dirPath = '';
            let partial = param;

            if (param.includes('/')) {
                const endsWithSlash = param.endsWith('/');
                if (endsWithSlash) {
                    let base = param.replace(/\/+$/, '');
                    if (!base && param.startsWith('/')) {
                        base = '/';
                    }
                    dirPath = base;
                    partial = '';
                } 
                else {
                    const lastSlash = param.lastIndexOf('/');
                    let base = param.slice(0, lastSlash);
                    if (lastSlash === 0) {
                        base = '/';
                    }
                    dirPath = base;
                    partial = param.slice(lastSlash + 1);
                }
            }

            if (dirPath && dirPath !== '/') {
                dirPath = dirPath.replace(/\/+$/, '');
            }

            let basePrefix = '';
            if (!dirPath) {
                basePrefix = '';
            } 
            else if (dirPath === '/') {
                basePrefix = '/';
            } 
            else {
                basePrefix = `${dirPath.replace(/\/+$/, '')}/`;
            }

            return { dirPath, partial, basePrefix };
        },
        normalizeTutorialPath(input) {
            if (!input || typeof input !== 'string') {
                return '';
            }
            let value = input.trim();
            if (value === '' || value === '.') {
                return this.getPath(this.currentNode) || 'root';
            }
            const trimmed = value.replace(/\/+$/, '');
            if (trimmed === '') {
                return 'root';
            }
            const isAbsolute = trimmed.startsWith('/');
            const base = isAbsolute
                ? ['root']
                : (this.getPath(this.currentNode) || 'root')
                    .split('/')
                    .filter((seg) => seg.length > 0);
            if (base[0] !== 'root') {
                base.unshift('root');
            }
            const segments = trimmed.split('/').filter((seg) => seg.length > 0);
            const stack = [...base];

            segments.forEach((segment) => {
                if (segment === '.' || segment === '') {
                    return;
                }
                if (segment === '..') {
                    if (stack.length > 1) {
                        stack.pop();
                    }
                    return;
                }
                stack.push(segment);
            });

            return stack.join('/');
        },
        preserveCurrentPath() {
            const nodePath = this.currentNode ? this.getPath(this.currentNode) : '';
            let normalized = nodePath ? nodePath.replace("root", "") : "/";
            if (!normalized || normalized === "") {
                normalized = "/";
            }
            this.pwd = normalized;
        },
        getPermissionBlock(node) {
            const meta = node?.data ?? node;
            if (!meta?.rights) {
                return '';
            }
            const rights = meta.rights;
            const owner = rights.slice(1, 4);
            const group = rights.slice(4, 7);
            const other = rights.slice(7, 10);

            if (meta.user === this.currentUser) {
                return owner;
            }
            if (this.currentGroups?.includes(meta.group)) {
                return group;
            }
            return other;
        },
        isOwner(node) {
            const meta = node?.data ?? node;
            return meta?.user === this.currentUser;
        },
        hasPermission(node, permissions) {
            const block = this.getPermissionBlock(node);
            if (!block) {
                return false;
            }

            const perms = Array.isArray(permissions)
                ? permissions
                : (typeof permissions === 'string' && permissions.length > 0
                    ? permissions.split('')
                    : []);

            if (perms.length === 0) {
                return true;
            }

            return perms.every((perm) => block.includes(perm));
        }

    },
  };
</script>
  
<style lang="scss" model>
    .floating-robot {
        position: fixed;
        top: 13px;
        left: 13px;
        width: 500px;
        height: 70px;
        z-index: 1050;
        pointer-events: auto;
        animation: ghostFloat 4s ease-in-out infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        .robot-sprite {
            position: absolute;
            left: 0;
            width: 80px;
            // width: 100%;
            height: auto;
            transform-origin: center;
            display: block;
        }
        .robot-sprite.robot-jump {
            animation: robotJump 0.7s ease;
        }
        .robot-sprite.robot-flicker {
            animation: robotFlicker 0.8s steps(4) forwards;
        }
        .robot-tooltip {
            position: absolute;
            top: -10px;
            left: 80px;
            min-width: 140px;
            max-width: 500px;
            background: rgba(20, 20, 20, 0.92);
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            animation: tooltipFade 0.35s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            .robot-command {
                font-weight: 600;
                color: #8ae9ff;
            }
            .robot-mnemonic {
                color: #ffe38f;
            }
        }
        .robot-tooltip-icon {
            flex-shrink: 0;
        }
        .robot-tooltip--success {
            background: rgba(21, 117, 39, 0.9);
            color: #e8ffe9;
        }
        .robot-tooltip--warning {
            background: rgba(164, 111, 14, 0.9);
            color: #fff4da;
        }
        .robot-tooltip--error {
            background: rgba(146, 25, 25, 0.92);
            color: #ffeaea;
        }
        .robot-sound-toggle {
            position: absolute;
            top: 80px;
            left: 0;
            transform: translateX(-10px);
            background: rgba(15, 15, 15, 0.95);
            color: #f2f2f2;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.78rem;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            animation: tooltipFade 0.25s ease;
        }
    }

    @keyframes ghostFloat {
        0% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
        100% { transform: translateY(0); }
    }

    @keyframes robotJump {
        0% { transform: translateY(0) scale(1); }
        15% { transform: translateY(-22px) scale(1.05); }
        30% { transform: translateY(-10px) scale(0.96); }
        45% { transform: translateY(-18px) scale(1.02); }
        60% { transform: translateY(-6px) scale(0.98); }
        80% { transform: translateY(-12px) scale(1.01); }
        100% { transform: translateY(0) scale(1); }
    }

    @keyframes robotFlicker {
        0% { opacity: 1; transform: scale(1); }
        20% { opacity: 0.4; transform: scale(0.98); }
        30% { opacity: 0.7; transform: scale(1.02); }
        50% { opacity: 0.25; transform: scale(0.97); }
        70% { opacity: 0.8; transform: scale(1.01); }
        100% { opacity: 1; transform: scale(1); }
    }

    @keyframes tooltipFade {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .v-container {
        width: 97vw;
        min-width: 1000px;
        .cont-cmd-graph-navigaion{
            .cont-cmd {
                margin: 5px 15px;
                border-radius: 7px;
                padding: 5px;
                background-color: #333;
                width: 50%;
                height: 65vh;
                position: relative;
                overflow: hidden;
                box-shadow: 1px 1px 5px #333;
                .badges-actions {
                    margin: auto;
                    width: 97%;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .v-text-field {
                    margin: auto;
                    width: 97%;
                    position: absolute;
                    // top: 50px;
                    z-index: 1;
                }
                .v-list {
                    z-index: 0;
                    display: block;
                    overflow: auto !important;
                    position: relative;
                    height: calc(100% - 95px);
                    top: 90px;
                    padding: 0 6px 30px;
                    margin-top: -20px;
                    .v-list-item-title{
                        .in-terminal-i {
                            font-size: 17px !important;
                        }
                    }
                    .v-list-item-subtitle {
                        font-family: 'Roboto Mono', monospace;
                        display: table-caption;
                        width: 100%;
                        display: block;
                    }
                }
            }

            + div {
                // border: #333 solid 1px;
                border-radius: 10px;
            }
        }
    }

    #tree {
        margin: auto;
        width: 50%;
        height: 65vh;
        svg {
            overflow: hidden;
            height: 100%;
            // border: 1px solid #ddd;
            width: 100% !important;
        }
    }

    #output_animate {
        width: 90%;
        svg {
            width: 100% !important;
        }
    }

    #history-cmd {
        margin-top: 20px; 
        background: #333; 
        border-radius: 10px; 
        padding: 10px; 
        box-shadow: 1px 1px 5px #333;
    }

    .mdi-icon-folder {
        color: #535050;
    }

    .tooltip {
        position: absolute;
        background-color: #333;
        color: white;
        border-radius: 2px 5px;
        padding: 1px 10px;
        pointer-events: none;
        font-size: 12px;
    }

    .cont-chmod-card {
        .v-card {
            font-family: 'Roboto Mono', monospace;
        }
    }

    @keyframes fadeInOut {
        0%, 100% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
    }

    .fadein {
        animation: fadeInOut 1s ease-in-out infinite;
    }

    .bounce {
        animation: scaleBounce 0.7s ease-in-out;
    }

    @keyframes scaleBounce {
        0% {
            opacity: 0;
            transform: scale(0.5);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
        70% {
            transform: scale(0.9);
        }
        100% {
            transform: scale(1);
        }
    }

    .tutorial-card {
        margin: 20px;
        // background-color: rgba(14, 20, 30, 0.9);
        background-color: white;
        border: 1px solid rgba(125, 226, 209, 0.3);
        color: #e9f8ff;
        .text-subtitle-1 {
            color: #DDDDDDCC;
            margin-top: 25px;
        }

        .tutorial-description {
            color: #CCCCCCCC;
            code {
                font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
                background: rgba(125, 226, 209, 0.18);
                color: #00c9a7;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
                letter-spacing: 0.02em;
                display: inline-block;
                margin: 2px 0;
            }
        }

        .info-step-tutorial {
            margin-top: -10px;
            color: #CCCCCCCC;
        }

        .v-alert {
            margin-top: 60px;
        }
    }

    .tutorial-feedback {
        margin-top: 8px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 6px;
        padding: 8px 10px;
        background-color: rgba(255, 255, 255, 0.08);
        color: #d7f7ff;
        .feedback-icon {
            margin-right: 2px;
        }
        &.is-success {
            background-color: rgba(58, 255, 176, 0.12);
            color: #70f3c1;
        }
        &.is-hint {
            background-color: rgba(255, 214, 0, 0.12);
            color: #ffd54f;
        }
    }

    .mission-title {
        display: flex;
        align-items: center;
    }

    .mission-intro {
        font-size: 0.92rem;
        line-height: 1.45;
    }

    .badge-unlock-enter-active,
    .badge-unlock-leave-active {
        transition: all 0.35s ease;
    }

    .badge-unlock-enter-from,
    .badge-unlock-leave-to {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    .badge-unlock-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 500;
        min-width: 280px;
        max-width: 460px;
        padding: 1px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(15, 76, 92, 0.9), rgba(0, 153, 134, 0.95));
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .badge-glow {
        position: absolute;
        inset: -30%;
        background: radial-gradient(circle, rgba(125, 226, 209, 0.25), transparent 60%);
        opacity: 0.8;
        animation: pulseGlow 2.4s ease-in-out infinite;
        pointer-events: none;
    }

    @keyframes pulseGlow {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.6; }
    }

    .badge-unlock-content {
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        background: linear-gradient(115deg, rgba(2, 16, 26, 0.85), rgba(5, 40, 61, 0.9));
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .badge-icon-wrapper {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle, rgba(255, 213, 79, 0.35), rgba(0, 0, 0, 0.65));
        box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.2);
    }

    .badge-icon {
        color: #ffd54f;
        text-shadow: 0 0 8px rgba(255, 213, 79, 0.9);
    }

    .badge-unlock-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .badge-unlock-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7de2d1;
    }

    .badge-unlock-name {
        font-size: 1.05rem;
        font-weight: 600;
        color: #ffffff;
    }

    .badge-unlock-description {
        font-size: 0.85rem;
        color: #b0bec5;
    }

    .badge-view-btn {
        text-transform: none;
        font-weight: 600;
    }

    .badges-actions {
        display: flex;
        justify-content: flex-end;
        margin: 12px 0;
    }

    .badge-panel .badge-item {
        border-radius: 16px;
        
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(4px);
        text-transform: none;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .badge-panel .badge-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
    }

    .badge-earned-card {
        position: relative;
        color: #d5f9ff;
        background: transparent;
        box-shadow: 0 12px 22px rgba(0, 0, 0, 0.35), inset 0 0 20px rgba(23, 255, 221, 0.08);

        border: 1px solid rgb(11 232 235) !important;
        .v-card-text {
            border-radius: 12px;
            padding: 14px 12px;
            background: linear-gradient(45deg, rgba(5, 46, 60, 0.9), rgba(8, 126, 138, 0.9));
            color: #eaffff;
        }
    }

    .badge-locked-card {
        color: black;
        background: radial-gradient(circle at top, rgba(96, 125, 139, 0.2), rgba(23, 32, 42, 0.8));
        opacity: 0.7;
        .v-icon {
            color: gray
        }
    }

    .badge-earned {
        color: #fdd835;
        font-weight: 600;
    }

    .badge-locked {
        color: #b0bec5;
    }

    .badge-icon-earned {
        color: #9af7ea;
    }

    .badge-icon-locked {
        color: rgba(255, 255, 255, 0.45);
    }

    .command-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 6px;
        padding-left: 4px;
    }
    .command-suggestions.global {
        // margin-bottom: 12px;
        margin: 0;
        width: 50%;
        height: 40px;
        padding: 0 8px;
    }

    .suggestion-chip {
        font-size: 0.75rem;
        letter-spacing: 0.02em;
    }

    .command-input-wrapper {
        position: relative;
    }

    .command-input-wrapper.hint-active :deep(.v-field) {
        animation: pulseGlowBorder 1.4s ease-in-out infinite;
    }

    @keyframes pulseGlowBorder {
        0% { box-shadow: 0 0 0 rgba(125, 226, 209, 0.2); }
        50% { box-shadow: 0 0 15px rgba(125, 226, 209, 0.45); }
        100% { box-shadow: 0 0 0 rgba(125, 226, 209, 0.2); }
    }

    .command-input-hint {
        position: absolute;
        z-index: 10;
        top: 11px;
        right: 10px;
        display: flex;
        align-items: center;
        background: linear-gradient(135deg, rgba(4, 44, 60, 0.95), rgba(8, 134, 149, 0.9));
        color: #eaffff;
        font-size: 0.8rem;
        padding: 6px 10px;
        border-radius: 999px;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
        user-select: none;
    }

    .command-input-hint .hint-arrow {
        margin-left: 6px;
        font-weight: 700;
    }

    .signal-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .signal-anim {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(125, 226, 209, 0.9), rgba(5, 15, 25, 0.6));
        box-shadow: 0 0 12px rgba(125, 226, 209, 0.9);
        animation: signalTravel 0.9s ease-out forwards;
    }

    @keyframes signalTravel {
        from {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        to {
            transform: translate(var(--signal-end-x, 0px), var(--signal-end-y, 0px)) scale(0.3);
            opacity: 0;
        }
    }
</style>

<style lang="scss" scoped>
    .v-chip {
        margin: 7px 3px;
    }
    .link {
        fill: none;
        stroke: #ccc;
        stroke-width: 2px;
    }
    .node circle {
        fill: #fff;
        stroke: steelblue;
        stroke-width: 3px;
        transition: all 0.5s ease;
    }
    .node text {
        font: 12px sans-serif;
    }
</style>
