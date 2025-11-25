<template>
    <v-container>
        <v-dialog
            v-model="tutorial.showIntro"
            max-width="520"
        >
            <v-card>
                <v-card-title class="text-h6">
                    Briefing de mission
                </v-card-title>
                <v-card-text>
                    <p>
                        Bienvenue jeune padawan du terminal ! L'ordinateur d'entraînement simulateur Linux a besoin de toi.
                    </p>
                    <p>
                        Objectif : repérer ta position, explorer les dossiers, nettoyer un vieux répertoire <strong>archives</strong> et préparer un nouveau dossier <strong>mission</strong> avec son fichier <strong>briefing.txt</strong>.
                    </p>
                    <p>
                        Tu peux suivre le tutoriel guidé ou tout passer et jouer en autonomie.
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
        <div class="cont-cmd-graph-navigaion" style="display: flex;">
            <!-- Command input section -->
            <div class="cont-cmd">
                <v-text-field
                    v-model="command"
                    flat
                    prefix="$"
                    color="white"
                    theme="dark"
                    base-color="white"
                    bg-color="#333"
                    variant="solo"
                    label="Entrez une commande (help, cd, ls, mkdir, touch, chmod...)"
                    @keyup.enter="executeCommand()"
                    @keyup="navigateTerminal($event)"
                    @keydown.tab.prevent="autoCompleteCommand"
                    placeholder="Par exemple : cd documents"
                ></v-text-field>

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
                            >
                                {{ tutorial.feedback }}
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
                    color="success"
                >
                    Mission accomplie ! Tu peux continuer à t'entraîner librement.
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
                                                class="badge-item"
                                                :elevation="badge.earned ? 6 : 1"
                                                :color="badge.earned ? 'amber-darken-3' : 'grey-darken-3'"
                                            >
                                                <v-card-text class="text-center">
                                                    <v-icon size="28">
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

                <v-snackbar
                    v-model="badgeSnackbar.show"
                    timeout="4000"
                    color="amber-darken-2"
                    location="bottom"
                >
                    <div class="badge-snackbar-content">
                        <v-icon size="18" class="mr-2" v-if="badgeSnackbar.icon">
                            {{ badgeSnackbar.icon }}
                        </v-icon>
                        <span>{{ badgeSnackbar.message }}</span>
                    </div>
                </v-snackbar>

                <!-- Command output section -->
                <v-list 
                    class="output-cmd"
                    ref="outputCmd"
                    base-color="white"
                    bg-color="#333"
                    :height="tutorial.active && !tutorial.showIntro && !tutorial.completed ? 205 : ''"
                >
                    <v-list-item
                        v-for="(cmd, index) in commandHistory" 
                        :key="index"
                    >
                        <div v-if="commandHistory.length-(cursorHistory) != index">
                            <v-list-item-title  v-html="`<span style='color: #33ff90'>$ ${cmd.command.split(' ')[0]}</span> ${cmd.command.split(' ').slice(1).join(' ')} `"></v-list-item-title>

                            <v-list-item-subtitle v-html="cmd.output.replaceAll('\n', '<br>')"></v-list-item-subtitle>
                        </div>

                        <div v-else>
                            <!-- <i class="mdi-close-circle mdi v-icon notranslate v-theme--light v-icon--size-default v-icon--start" aria-hidden="true"></i>  -->
                            <v-list-item-title  v-html="`<span style='color: #33ff90'>$ ${cmd.command.split(' ')[0]}</span> ${cmd.command.split(' ').slice(1).join(' ')} <i class='mdi-map-marker mdi in-terminal-i v-icon' aria-hidden='true'></i>`"></v-list-item-title>

                            <v-list-item-subtitle v-html="cmd.output.replaceAll('\n', '<br>')"></v-list-item-subtitle>
                        </div>
                    </v-list-item>
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

                    <div
                        v-else
                    >
                        <v-chip 
                            v-for="(cmd, index) in commandHistory.filter((cmd) => cmd.command != '')" 
                            :key="index"
                            :color="cmd.state == 'valid' ? 'green-accent-2' : (cmd.state == 'error' ? 'red-lighten-1' : 'amber-accent-4')"
                            :prepend-icon="cmd.state == 'valid' ? 'mdi-check-circle' : (cmd.state == 'error' ? 'mdi-close-circle' : 'mdi-alert-circle')"
                            :append-icon="commandHistory.length-(cursorHistory) == index ? 'mdi-map-marker' : ''"
                            class="bounce"
                            @click="command = cmd.command"
                        >
                            {{ cmd.command }}
                        </v-chip>
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
    },
    data() {
        return {
            root: null,
            pwd: "",
            command: '',
            output: '',
            currentNode: null, // Le dossier courant
            folderTreeData: JSON.parse(JSON.stringify(folderTree)), // Copie locale de folderTree
            commandHistory: [], // Historique des commandes
            cursorHistory: 0,
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
                steps: [
                    {
                        id: 'pwd',
                        title: '1. Repérer ta position',
                        description: 'Tape <code>pwd</code> pour afficher le chemin comme <strong>root &gt; home &gt; user</strong>.',
                        success: 'Tu sais maintenant où tu te trouves.'
                    },
                    {
                        id: 'ls',
                        title: '2. Observer les environs',
                        description: 'Exécute <code>ls</code> (optionnellement avec <code>-l</code>) pour voir les dossiers disponibles.',
                        success: 'Cartographie du secteur réalisée.'
                    },
                    {
                        id: 'cd-documents',
                        title: '3. Atteindre le dossier documents',
                        description: 'Utilise <code>cd documents</code> (ou le chemin absolu) pour rejoindre le dossier <strong>documents</strong>.',
                        success: 'Bienvenue dans les documents.'
                    },
                    {
                        id: 'rm-archives',
                        title: '4. Nettoyer les archives',
                        description: 'Supprime l’ancien dossier <code>archives</code> avec <code>rm -r archives</code>.',
                        success: 'Archives nettoyées avec succès.'
                    },
                    {
                        id: 'mkdir-mission',
                        title: '5. Préparer la mission',
                        description: 'Crée un nouveau dossier <code>mission</code> (ex: <code>mkdir mission</code>) dans <strong>documents</strong>.',
                        success: 'Dossier mission créé.'
                    },
                    {
                        id: 'cd-mission',
                        title: '6. Entrer dans mission',
                        description: 'Déplace-toi dans le dossier <code>mission</code>.',
                        success: 'Mission est maintenant ton dossier courant.'
                    },
                    {
                        id: 'touch-briefing',
                        title: '7. Créer le briefing',
                        description: 'Crée un fichier <code>briefing.txt</code> (ex: <code>touch briefing.txt</code>) dans <strong>mission</strong>.',
                        success: 'Briefing.txt est en place, mission accomplie !'
                    },
                ],
            },
            showBadgePanel: false,
            badgeSnackbar: {
                show: false,
                message: '',
                icon: '',
            },
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
        };
    },
    mounted() {
        this.createTree();
        this.createOutputAnimate()
        this.loadCommandHistory();
        this.loadBadgeState();
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
                    this.changeDirectory("home/user")
                    this.cDirect.from = null;
                    this.createOutputAnimate()
                }.bind(this), 750)
            } 
            else {
                this.currentNode = root;
                setTimeout(function(){
                    this.changeDirectory(this.pwd)
                    // this.cDirect.from = null;
                    // this.createOutputAnimate()
                }.bind(this), 50)
            }

            const update = (source) => {

                if(source.id == this.root.id)
                    i = 0;
                
                const treeLayout = d3.tree().size([height, width - 120]);
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
                    // '.' signifie le répertoire courant, donc on ne change rien.
                    continue;
                } 
                else if (seg === "..") {
                    // '..' signifie le répertoire parent (s'il existe)
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
                const commands = ['help', 'man', 'pwd', 'echo', 'cd', 'ls', 'mkdir', 'touch', 'rm', 'chmod'];

                const matches = commands.filter(c => c.startsWith(cmd));

                if (matches.length === 1) {
                    this.command = matches[0] + ' ';
                } 
                else if (matches.length > 1) {
                    this.output = `Suggestions: ${matches.join(', ')}`;

                    this.commandHistory.push({ 
                        command: "", 
                        state: "",
                        output: this.output,
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
                    
                    this.commandHistory.push({ 
                        command: "", 
                        state: "",
                        output: this.output,
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
        },
        skipTutorial() {
            this.tutorial.showIntro = false;
            this.tutorial.active = false;
            this.tutorial.showSuccess = false;
            this.tutorial.feedback = '';
        },
        finishTutorial() {
            this.tutorial.completed = true;
            this.tutorial.active = false;
            this.tutorial.feedback = 'Mission accomplie, continue librement !';
            this.tutorial.showSuccess = true;
            this.stats.tutorialCompleted = true;
            this.checkBadges();
        },
        handleTutorialProgress(cmd, params) {
            if (!this.tutorial.active || this.tutorial.showIntro || this.tutorial.completed) {
                return;
            }

            const step = this.tutorial.steps[this.tutorial.currentStep];
            if (!step) {
                return;
            }

            const normalizedCmd = (cmd || '').toLowerCase();
            const currentNodePath = this.currentNode ? this.getPath(this.currentNode) : '';
            const currentPath = currentNodePath ? (currentNodePath.replace('root', '') || '/') : '/';
            const documentsNode = this.root ? this.getNodeFromPath('/home/user/documents') : null;
            const archivesNode = this.root ? this.getNodeFromPath('/home/user/documents/archives') : null;
            const missionNode = this.root ? this.getNodeFromPath('/home/user/documents/mission') : null;
            const briefingNode = this.root ? this.getNodeFromPath('/home/user/documents/mission/briefing.txt') : null;
            let success = false;

            switch (step.id) {
                case 'pwd':
                    success = normalizedCmd === 'pwd';
                    break;
                case 'ls':
                    success = normalizedCmd === 'ls';
                    break;
                case 'cd-documents':
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
                this.tutorial.currentStep += 1;
                if (this.tutorial.currentStep >= this.tutorial.steps.length) {
                    this.finishTutorial();
                }
            }
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
            this.badgeSnackbar.message = `Badge débloqué : ${badge.title}`;
            this.badgeSnackbar.icon = badge.icon;
            this.badgeSnackbar.show = true;
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
            const args = this.command.trim().split(' ');

            const cmd = args[0];
            const param = args.slice(1);
            
            let state = 'valid';

            this.cDirect.from = null;
            this.chmodInfos.data.user = [];
            this.createOutputAnimate();

            if (param.includes('-h')) {
                this.output = this.getHelp(cmd);
                
                this.commandHistory.push({ 
                    command: this.command, 
                    state, 
                    output: this.output 
                });
                
                this.command = '';
                
                setTimeout(()=>{
                    $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
                }, 50)
                
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
                    this.echo(param);
                    break;
                case 'cd':
                    state = this.changeDirectory(param);
                    break;
                case 'ls':
                    this.listDirectory(param);
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

            this.handleTutorialProgress(cmd, param);

            this.commandHistory.push({ 
                    command: this.command, 
                    state,
                    output: state != 'error' ? this.output : `<span style="color: #fe4444">${this.output}<span/>`
                });
            this.saveCommandHistory();
            
            setTimeout(()=>{
                $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
            }, 50)
           
            this.command = '';
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
                    - mkdir : Crée un nouveau dossier
                    - touch : Crée un nouveau fichier
                    - rm : Supprime un fichier ou un dossier
                    - chmod : Change les permissions d'un fichier ou d'un dossier
                `,
                'pwd': 'Usage: pwd [-h]\nAffiche le chemin du répertoire courant.',
                'echo': 'Usage: echo [-h] [message]\nAffiche un message.',
                'cd': 'Usage: cd [-h] [répertoire]\nChange de répertoire.',
                'ls': 'Usage: ls [-h] [-a] [-l]\nListe les fichiers et dossiers.',
                'mkdir': 'Usage: mkdir [-h] [dossier]\nCrée un nouveau dossier.',
                'touch': 'Usage: touch [-h] [fichier]\nCrée un nouveau fichier.',
                'rm': 'Usage: rm [-h] [-r] [fichier|dossier]\nSupprime un fichier ou un dossier.',
                'chmod': 'Usage: chmod [-h] [permissions] [fichier|dossier]\nChange les permissions d\'un fichier ou d\'un dossier.',
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
        echo(params){
            this.output = params.join(" ")
        },
        pathWayDirectory(){//pwd
            this.output = this.getPath(this.currentNode).replace("root", "");
            
            if(this.output=="")
                this.output="/"
            
            this.pwd = this.output;
            this.updateTree(this.currentNode);
        },
        changeDirectory(params) {//cd
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
                this.changeDirectory("home/user")
                this.cDirect.to = this.currentNode.data.name;
                this.output = `Deplacement vers le dossier personnel (par default) : ${this.currentNode.data.name}`;
                this.updateTree(this.currentNode);
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

            this.pwd = ""
            this.output = `Dossier actuel : ${this.currentNode.data.name}`;
            this.createOutputAnimate()
            this.updateTree(this.currentNode);
            this.trackDirectoryVisit(this.getPath(this.currentNode));
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

            // Prépare les enfants à afficher
            let nodeChildren;
            if (isParentListing) {
                nodeChildren = targetNode.children || targetNode._children || [];
            } 
            else {
                targetNode.children = targetNode._children || targetNode.children || [];
                nodeChildren = targetNode.children;
            }

            // Filtre les fichiers cachés si `-a` n'est pas spécifié
            const children = showHidden
                ? nodeChildren
                : nodeChildren.filter((child) => !child.data.hidden);

            if (!isParentListing) {
                targetNode.children = children;
            }
            
            // Génère la sortie
            if (children.length === 0) {
                this.output = "Dossier vide";
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

            // console.log("-----", this.currentNode, targetNode);

            // Met à jour l'arbre uniquement si l'on parcourt le répertoire courant ou un sous-dossier
            if (!isParentListing) {
                this.updateTree(this.currentNode);
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
                this.createTree();
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
                this.createTree();
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

            this.updateTree(this.currentNode);
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
                this.createTree();
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
        color: #7de2d1;
    }

    .badges-actions {
        display: flex;
        justify-content: flex-end;
        margin: 12px 0;
    }

    .badge-earned {
        color: #fdd835;
        font-weight: 600;
    }

    .badge-locked {
        color: #b0bec5;
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
