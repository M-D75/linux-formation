<template>
    <v-container>
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
                    @keyup="naveTerminal($event)"
                    @keydown.tab.prevent="autoCompleteCommand"
                    placeholder="Par exemple : cd documents"
                ></v-text-field>

                <!-- Command output section -->
                <v-list 
                    class="output-cmd"
                    ref="outputCmd"
                    base-color="white"
                    bg-color="#333"
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
        };
    },
    mounted() {
        this.createTree();
        this.createOutputAnimate()
    },
    methods: {
        buidRightsInfos(){
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
                    .attr('stroke', (d) => _vue.isPathToCurrentNode(d.target) ? (!_vue.pwd || _vue.pwd == "" ? 'orange' : 'blue') : '#ccc')
                    .attr('stroke-width', (d) => _vue.isPathToCurrentNode(d.target) ? 17 : 2)
                    .attr('stroke-dasharray', (d) => _vue.isPathToCurrentNode(d.target) ? '6 9' : '0')

                // Mettre à jour les liens existants
                linkEnter.merge(link)
                    .transition()
                    .duration(750)
                    .attr('d', (d) => diagonal(d.source, d.target))
                    .attr('stroke', (d) => _vue.isPathToCurrentNode(d.target) ? (!_vue.pwd || _vue.pwd == "" ? 'orange' : 'blue') : '#ccc')
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
        naveTerminal(event){
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
            const param = args.slice(-1).join(' ');

            if ( args.length === 1 ) {// Autocomplétion de la commande
                const commands = ['help', 'pwd', 'echo', 'cd', 'ls', 'mkdir', 'touch', 'rm', 'chmod'];

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
                // console.log("args", args);
                const currentNode = this.currentNode;

                let children = currentNode.children || currentNode._children || [];
                let matches = [];
                let pathParts = [];
                if (param.startsWith('/')) {
                    // console.log("param", param);
                    pathParts = param.split('/');
                    let node = this.root;
                    for (let i = 1; i < pathParts.length - 1; i++) {
                        node = node.children?.find(child => child.data.name === pathParts[i]) || node._children?.find(child => child.data.name === pathParts[i]);
                        if (!node) break;
                    }

                    if (node) {
                        children = node.children || node._children || [];
                        matches = children.filter(child => child.data.name.startsWith(pathParts[pathParts.length - 1])).map(child => child.data.name);
                    }
                } 
                else {
                    // console.log("param", param);
                    const lastParam = args[args.length - 1];

                    matches = children.filter(child => child.data.name.startsWith(lastParam)).map(child => child.data.name);
                }

                console.log(pathParts, matches, pathParts.slice(1, -1).join('/'));
                

                if ( matches.length === 1 ) {
                    const newParams = args.slice(1, -1).concat(matches[0]).join(' ');
                    
                    // regex qui identifie et récupérer les paramètres de la commande donc qui contient un '-' et un espace'
                    const _matches = newParams.match(/(-\w+)(\s+|$)/g);
                    
                    this.command = `${cmd} ${_matches ? _matches.join(' ') : ''}${param.startsWith('/') ? (pathParts?.length > 2 ? '/' : '') + pathParts.slice(1, -1).join('/') + '/' : ''}${matches[0]}`;
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
                case 'chmod':
                    state = this.chmodItem(param[1], param[0]);
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

            this.commandHistory.push({ 
                    command: this.command, 
                    state,
                    output: state != 'error' ? this.output : `<span style="color: #fe4444">${this.output}<span/>`
                });
            
            setTimeout(()=>{
                $(".output-cmd").scrollTop($(".output-cmd")[0].scrollHeight+500)
            }, 50)
           
            this.command = '';
        },
        getHelp(cmd = '') {
            const helpMessages = {
                '': `
                    Commandes disponibles :
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
                'chmod': 'Usage: chmod [-h] [permissions] [fichier|dossier]\nChange les permissions d\'un fichier ou d\'un dossier.'
            };
            return helpMessages[cmd] || `Commande inconnue : ${cmd}`;
        },
        echo(params){
            this.output = params.join(" ")
        },
        pathWayDirectory(){
            this.output = this.getPath(this.currentNode).replace("root", "");
            
            if(this.output=="")
                this.output="/"
            
            this.pwd = this.output;
            this.updateTree(this.currentNode);
        },
        changeDirectory(params) {
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
                        if (dirName === '..' && this.currentNode && this.currentNode != this.root) {
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
            return 'valid'
        },
        listDirectory(params) {
            // const _vue = this;
            function foundChild(dic, name){
                if(dic?.data.name == name){
                    return dic
                }
                else{
                    for (let index = 0; index < dic?.children?.length; index++) {
                        let element = dic.children[index];

                        if(element?.data.name == name){
                            return element
                        }

                        const _tmp = foundChild(element, name)


                        if(_tmp)
                            return _tmp
                    }
                }
                return null;
            }

            if( params.some((p) => /-[^ ]*a[^ ]*/.test(p)) ){
                this.ls.showHidden = true;
            }
            else{
                this.ls.showHidden = false;
            }

            // const currentNodeTemp = foundChild(d3.hierarchy(this.folderTreeData), this.currentNode.data.name)
            const currentNodeTemp = this.currentNode;

            console.log("currentNodeTemp", currentNodeTemp, this.currentNode)
            
            if ( this.currentNode._children ) {
                this.currentNode.children = !this.ls.showHidden ? this.currentNode?._children.filter((child) => !child.data.hidden) : this.currentNode?._children;
                // this.currentNode._children = null;
            }

            if (currentNodeTemp && !this.hasPermission(currentNodeTemp, 'r')) {
                this.output = "Permissions non accordées pour lire ce dossier.";
                return;
            }

            if( currentNodeTemp && params.some((p) => /-[^ ]*l[^ ]*/.test(p)) && currentNodeTemp.children ){        
                this.output = currentNodeTemp.children.filter((child) => !child.data?.hidden || params.some((p) => /-[^ ]*a[^ ]*/.test(p))).map((child) => {
                        return `${child.data.rights}  ${child.data.user}  ${child.data.group}  ${child.data.date}  ${child.data.name}`.replaceAll(" ", "&nbsp;")
                    }).join('\n');
            }
            else if( currentNodeTemp && params.includes("-a") && currentNodeTemp.children ){
                this.output = currentNodeTemp.children.map((child) => {
                        return child.data.name
                    }).join('\n');
            }
            else if(currentNodeTemp && params.length == 0 && currentNodeTemp.children ){
                this.output = currentNodeTemp.children.filter((child) => !child.data.hidden).map((child) => child.data.name).join('\n');
            }

            this.updateTree(this.currentNode);
        },
        makeDirectory(params) {
            if (!params) {
                this.output = 'Nom de dossier requis';
                return;
            }

            let dirNames = []
            if(typeof params == "object")
                dirNames = params
            else
                dirNames = [params]

            let state = "valid"
            for (let index = 0; index < dirNames.length; index++) {
                const dirName = dirNames[index];

                
                const targetNode = this.findNodeInTree(d3.hierarchy(this.folderTreeData), this.currentNode.data.name, this.currentNode.depth);

                let added = false;
                if (targetNode) {
                    if (!targetNode.children) {
                        targetNode.children = [];
                    }

                    if( targetNode.data.children.every(item => item.name !== dirName) ){
                        const now = new Date();


                        const month = String(now.getMonth() + 1).padStart(2, '0');

                        const day = String(now.getDate()).padStart(2, '0');


                        const hours = String(now.getHours()).padStart(2, '0');

                        const minutes = String(now.getMinutes()).padStart(2, '0');


                        const formattedDate = `${String(now.getFullYear()).slice(2).padStart(2, '0')}-${month}-${day} ${hours}:${minutes}`;


                        const rep = {

                            name: dirName,
                            type: "d",
                            rights: "drwxr-xr-x",
                            user: "user",
                            group: "user",
                            hidden: dirName[0] == '.' ? true : false,
                            date: formattedDate,
                            children: [], 
                        }

                        targetNode.children.push(rep);
                        targetNode.data.children.push(rep);

                        added = true;
                    }
                }

                if(added){
                    this.updateNode(this.currentNode, targetNode.data.name, null, targetNode)
                    // console.log("mk", this.currentNode, this.folderTreeData);
                    // this.folderTreeData = this.root.data;

                    let pwd = this.getPath(targetNode)
                    this.pwd = pwd.replace("root", "")

                    this.createTree();
                    this.output = `Dossier créé : ${dirName}`;
                }
                else{
                    this.output = `Erreur lors de la création du dossier : ${dirName}`;
                    state = 'warning'
                }
            }

            return state
        },
        createFile(params) {
            if (!params) {
                this.output = 'Nom de fichier requis';
                return;
            }
            
            const targetNode = this.findNodeInTree(d3.hierarchy(this.folderTreeData), this.currentNode.data.name, this.currentNode.depth);

            let filesNames = "";
            for (let index = 0; index < params.length; index++) {
                const fileName = params[index];

                if(index==0)
                    filesNames += params[index];
                else
                    filesNames += ", " + params[index];

                if (targetNode) {
                    if (!targetNode.children) {
                        targetNode.children = [];
                    }

                    const now = new Date();


                    const month = String(now.getMonth() + 1).padStart(2, '0');

                    const day = String(now.getDate()).padStart(2, '0');


                    const hours = String(now.getHours()).padStart(2, '0');

                    const minutes = String(now.getMinutes()).padStart(2, '0');


                    const formattedDate = `${String(now.getFullYear()).slice(2).padStart(2, '0')}-${month}-${day} ${hours}:${minutes}`;


                    const file = {

                        name: fileName, 
                        type: "f",
                        rights: "-rwxr-xr-x",
                        user: "user",
                        group: "user",
                        hidden: fileName[0] == '.' ? true : false,
                        date: formattedDate,
                        children: null,
                    }

                    targetNode.children.push(file);
                    targetNode.data.children.push(file);
                }
            }

            // console.log("folder", this.folderTreeData);

            let pwd = this.getPath(targetNode)
            this.pwd = pwd.replace("root", "")
            this.createTree();
            this.output = `Fichier créé : ${filesNames}`;
        },
        removeItem(params) {
            if (!params) {
                this.output = 'Erreur : Aucun nom spécifié';
                return;
            }

            function remove(tree, child){
                if(tree?.name == child.parent.data.name && tree?.date == child.parent?.data.date){
                    const index = tree.children.findIndex((_child) => _child.name === child.data.name);

                    tree.children.splice(index, 1);
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

            let children = this.currentNode.children || this.currentNode._children;
            // console.log("data-before", this.folderTreeData)
            // console.log("params", params, children);
            if( this.currentNode.data?.rights.split("").slice(1, 4).join("").includes("w") && this.currentNode.data?.rights.split("").slice(1, 4).join("").includes("x") ){
                for (let index = 0; index < params.length; index++) {
                    const element = params[index]; 

                    
                    if( ! element.includes("-") ){// not option
                        if( ! params.includes("-r") ){
                            index = children.findIndex((child) => child.data.name === element && child.data.type !== "d");
                        }
                        else{
                            index = children.findIndex((child) => child.data.name === element);
                        }

                        if (index === -1) {
                            this.output = `Erreur : Élément '${element}' introuvable`;
                            return;
                        }

                        let child = children[index];

                        remove(this.folderTreeData, child)
                        
                        children.splice(index, 1);
                    }
                }
            }
            else{
                this.output = `Vous ne possédez pas les droits nécessaire pour supprimé cet élément '${params}'`;
                return;
            }
            // console.log("data", this.folderTreeData, "|", this.folderTreeNoHidden, "|", children)
            this.updateTree(this.currentNode);
            this.output = `Élément '${params}' supprimé avec succès`;
        },
        getPath(node) {
            if (node.parent) {
                return `${this.getPath(node.parent)}/${node.data.name}`;
            }
            return node.data.name;
        },
        chmodItem(itemName, permissions) {
            if (!itemName || !permissions) {
                this.output = 'Erreur : Nom d\'élément ou permissions non spécifiés';
                return "error";
            }

            const target = this.findNodeInTree(this.currentNode, itemName);

            if (!target) {
                this.output = `Erreur : Élément '${itemName}' introuvable`;
                return "warning";
            }

            this.chmodInfos.fileName = "";
            this.chmodInfos.rights = "----------";

            // format numérique (ex: 755)
            if (/^[0-7]{3}$/.test(permissions)) {
                let permStr = this.convertNumericPermissions(permissions);

                target.data.rights = permStr;
                target.data.rights = target.data.type.replace("f", "-") + target.data.rights.slice(1)
                target.rights = target.data.rights;

                const name = target.data.name

                delete target.data;
                delete target.parent;
                delete target.depth;
                delete target._children;
                delete target.height;

                this.chmodInfos.fileName = name;
                this.chmodInfos.rights = target.rights;

                this.buidRightsInfos()

                this.updateNode(this.folderTreeData, name, target.depth, target)
            }
            else if (/^[ugoa]+[+-=][rwx]+$/.test(permissions)) {// format symbolique ex: u+r, g-w
                target.data.rights = this.applySymbolicPermissions(target.data.rights, permissions);

                target.data.rights = target.data.type.replace("f", "-") + target.data.rights.slice(1)
                target.rights = target.data.rights;

                const name = target.data.name

                delete target.data;
                delete target.parent;
                delete target.depth;
                delete target._children;
                delete target.height;

                this.chmodInfos.fileName = name;
                this.chmodInfos.rights = target.rights;

                this.buidRightsInfos()

                this.updateNode(this.folderTreeData, name, target.depth, target)
            }
            else {
                this.output = 'Erreur : Format de permissions invalide';
                return "error";
            }

            this.root = d3.hierarchy(this.folderTreeData)

            this.createTree();
            this.output = `Permissions de '${itemName}' mises à jour en '${target.rights}'`;
            return "valid"
        },
        convertNumericPermissions(numeric) {
            const permissionMap = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];

            return `d${permissionMap[numeric[0]]}${permissionMap[numeric[1]]}${permissionMap[numeric[2]]}`;
        },
        applySymbolicPermissions(currentRights, symbolic) {
            let [owner, group, other] = currentRights.slice(1).match(/.{3}/g); // Obtenir les permissions

            // decomposition de la commande
            const [entities, operation, modes] = symbolic.match(/^([ugoa]+)([+-=][rwx]+)$/).slice(1);


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
        hasPermission(node, permission) {
            const permissions = {

                'r': 4,
                'w': 2,
                'x': 1
            };
            const userPermissions = node.data.rights.slice(1, 4).split('').map(char => permissions[char] || 0).reduce((a, b) => a + b, 0);

            return userPermissions & permissions[permission];
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
                height: 50vh;
                position: relative;
                overflow: hidden;
                box-shadow: 1px 1px 5px #333;
                .v-text-field {
                    margin: auto;
                    width: 97%;
                    position: absolute;
                    top: 0;
                    z-index: 1;
                }
                .v-list {
                    z-index: 0;
                    display: block;
                    overflow: auto !important;
                    position: relative;
                    height: 90%;
                    top: 70px;
                    // margin-bottom: 70px;
                    padding-bottom: 10px;
                    margin-top: -30px;
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
        height: 50vh;
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
