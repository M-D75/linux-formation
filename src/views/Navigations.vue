<template>
    <v-container>
        <div class="cont-cmd-graph-navigaion" style="display: flex;">
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
                    label="Entrez une commande (cd, ls, mkdir, touch, help...)"
                    @keyup.enter="executeCommand"
                    placeholder="Par exemple : cd documents"
                ></v-text-field>

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
                        <v-list-item-title v-html="`<span style='color: #33ff90'>$ ${cmd.command.split(' ')[0]}</span> ${cmd.command.split(' ').slice(1).join(' ')}`"></v-list-item-title>
                        <v-list-item-subtitle v-html="cmd.output.replaceAll('\n', '<br>')"></v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </div>

            <div id="tree" ref="tree"></div>
        </div>

        <div style="margin-top: 20px;">
            <!-- <v-text-field
                v-model="command"
                variant="outlined"
                label="Entrez une commande (cd, ls, mkdir, touch)"
                @keyup.enter="executeCommand"
                placeholder="Par exemple : cd documents"
            ></v-text-field> -->

            <!-- <div style="margin-top: 10px;">
                <strong>Sortie :</strong>
                <div v-html="output"></div>
            </div> -->

            <div id="output_animate" ref="output_animate"></div>

            <div 
                id="history-cmd"
            >
                <!-- <v-chip-group
                    v-if="commandHistory.length"
                    column
                    label="Historique des commandes"
                > -->
                    <div 
                        v-if="commandHistory.length==0"
                        style="text-align: center;"
                    >
                        <v-chip 
                            color="white"
                            prepend-icon="mdi-information-slab-circle-outline"
                            class="box-show"
                        >
                            Historique des commandes
                        </v-chip>
                    </div>

                    <div
                        v-else
                    >
                        <v-chip 
                            v-for="(cmd, index) in commandHistory" 
                            :key="index"
                            :color="cmd.state == 'valid' ? 'green-accent-2' : (cmd.state == 'error' ? 'red-lighten-1' : 'amber-accent-4')"
                            :prepend-icon="cmd.state == 'valid' ? 'mdi-check-circle' : (cmd.state == 'error' ? 'mdi-close-circle' : 'mdi-alert-circle')"
                            class="box-show"
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
        folderTreeNoHidden(){
            console.log("BEGIN", this.folderTreeData);
            let foldersNoHidden = this.folderTreeData;

            const _vue = this;
            function filterChild(children){
                children = children.filter((child) => (
                        (!_vue.ls.showHidden 
                        && !child?.hidden 
                        && child.name[0] != '.'))
                    )

                children.forEach(child => {
                    if(child?.children && child.children.length != 0)
                        child.children = filterChild(child.children)
                });
                return children;
            }

            if(!this.ls.showHidden){
                foldersNoHidden.children = filterChild(this.folderTreeData.children)
            }
            else{
                this.ls.showHidden = false;
                this.ls.dirName = ""
            }

            console.log("END", this.folderTreeData);

            return foldersNoHidden;
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
            ls: {
                showHidden: false,
                dirName: ""
            }
        };
    },
    mounted() {
        this.createTree();
        this.createOutputAnimate()
    },
    methods: {
        createOutputAnimate(){
            const width = 500;
            const height = 150;
            let i = 0;
            const decalageX = 10;

            d3.select(this.$refs.output_animate).select("svg").remove()
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
                // .attr('x', width/2)
                .attr("text-anchor", "middle") // Centre horizontalement
                .attr("dominant-baseline", "middle") // Centre verticalement
                // .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                .attr('font-size', '17px')
                .style('user-select', 'none');


            g = svg.append("g")
                        .attr('transform', (d) => `translate(${decalageX},${height/2})`)

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
                        // .ease(d3.easeLinear)
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

            d3.select(this.$refs.tree).select("svg").remove()
            const svg = d3
                .select(this.$refs.tree)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-100, -100, width + 100, height + 100])
                .style('overflow', 'visible');
                
    
            const root = d3.hierarchy(this.folderTreeNoHidden);
            this.root = root;
            root.x0 = height / 2;
            root.y0 = 0;
    
            if (!this.currentNode) {
                this.currentNode = root; // Initialement, le dossier courant est la racine
                setTimeout(function(){
                    this.changeDirectory("home/user")
                }.bind(this), 750)
            } 
            else {
                this.currentNode = root; // Initialement, le dossier courant est la racine
                setTimeout(function(){
                    this.changeDirectory(this.pwd)
                }.bind(this), 50)
            }

            const update = (source) => {
                const treeLayout = d3.tree().size([height, width - 120]);
                treeLayout(root);
    
                const nodes = root.descendants();
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
                    .attr('class', (d) => d.id == this.currentNode?.id ? 'node current' : 'node')
                    .attr('transform', (d) => `translate(${width+1000},${height/2})`)
                    .on('click', (event, d) => {
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
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
                                ((d._children ? '<i class="mdi mdi-folder  mdi-icon-folder" style="font-size: 40px"></i>' : (d.data.children.length != 0 ? '<i class="mdi mdi-folder-open mdi-icon-folder" style="font-size: 40px"></i>' : '<i class="mdi mdi-folder-hidden mdi-icon-folder" style="font-size: 40px"></i>'))) 
                            : '<i class="mdi mdi-file-chart-outline mdi-icon-folder" style="font-size: 40px"></i>');

                nodeUpdate.each(function(d) {
                    if( _vue.currentNode?.id == d.id ){
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
                        if (d.id == this.currentNode?.id) {
                            return 'orange';
                        }
                        return d._children ? 'lightsteelblue' : '#fff';
                    })
                    .attr('stroke-width', (d) => (d.id == this.currentNode?.id ? 4 : 2))
                    .attr('stroke', (d) => (d.id == this.currentNode?.id ? 'black' : 'steelblue'))
                
               

                // Liens entre les nœuds
                const links = root.links();
                const link = svg.selectAll('path.link').data(links, (d) => d.target.id);
    
                // Supprimer les anciens liens
                link
                    .exit()
                    .transition()
                    .duration(750)
                    .attr('d', (d) => {
                        const o = { x: source.x0, y: source.y0 };
                        return diagonal(o, o);
                    })
                    .remove();
    
                // Ajouter de nouveaux liens
                const linkEnter = link
                    .enter()
                    .insert('path', 'g')
                    .attr('class', 'link')
                    .attr('d', (d) => {
                        const o = { x: source.x0, y: source.y0 };
                        return diagonal(o, o);
                    })
                    .attr('fill', 'none')
                    .attr('stroke', '#ccc')
                    .attr('stroke-width', 2);
    
                // Mettre à jour les liens existants
                linkEnter.merge(link)
                    .transition()
                    .duration(750)
                    .attr('d', (d) => diagonal(d.source, d.target));
    
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
    
            root.descendants().forEach((d) => {
                if (d.depth > 0) {
                    d._children = d.children;
                    d.children = null;
                }
            });
    
            update(root);
            this.updateTree = update; // Stocker la fonction `update` pour les mises à jour futures
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

            return null;
        },
        executeCommand() {
            const args = this.command.trim().split(' ');
            const cmd = args[0];
            const param = args.slice(1);
            let state = 'valid';
    
            switch (cmd) {
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
           
            this.command = ''; // Réinitialiser le champ de commande
        },
        echo(params){
            this.output = params.join(" ")
        },
        pathWayDirectory(){
            this.output = this.getPath(this.currentNode).replace("root", "");
            if(this.output=="")
                this.output="/"
        },
        changeDirectory(params) {
            let _dirName = ""
            if(typeof params == "object")//params
                _dirName = params[0];
            else//path
                _dirName = params;
            
            if(!_dirName){
                this.currentNode = this.root;
                this.changeDirectory("home/user")
                this.output = `Deplacement vers le dossier personnel (par default) : ${this.currentNode.data.name}`;
                this.updateTree(this.currentNode); 
                return;
            }
            else if(_dirName=='/'){
                this.currentNode = this.root;
            }
            else {
                if(_dirName[0]=='/'){
                    this.currentNode = this.root;
                }
                const _dirNames = _dirName.split("/")
                
                for (let index = 0; index < _dirNames.length; index++) {
                    const dirName = _dirNames[index];
                    if(dirName != ""){
                        if (dirName === '..' && this.currentNode) {
                            if (this.currentNode.parent.children) {
                                this.currentNode.parent.children.forEach((child) => {
                                    if (child.children) {
                                        child._children = child.children;
                                        child.children = null;
                                    }
                                });
                                this.currentNode.parent._children = this.currentNode.parent.children;
                                this.currentNode.parent.children = null;
                            }
                            this.currentNode = this.currentNode.parent;
                        } 
                        else {
                            const found = this.currentNode.children?.find((d) => d.data.name === dirName && d.data.type == "d") || this.currentNode._children?.find((d) => d.data.name === dirName &&  d.data.type == "d");
                            
                            if (found) {
                                if (this.currentNode._children && !this.currentNode.children) {
                                    this.currentNode.children = this.currentNode._children;
                                    this.currentNode._children = null;
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

            this.output = `Dossier actuel : ${this.currentNode.data.name}`;
            this.updateTree(this.currentNode); 
            return 'valid'
        },
        listDirectory(params) {
            console.log(this.folderTreeData, this.currentNode);
            const children = this.currentNode.children || this.currentNode._children || [];

            if (this.currentNode._children) {
                this.currentNode.children = this.currentNode._children;
                this.currentNode._children = null;
            }

            if(params.some((p) => /-[^ ]*a[^ ]*/.test(p))){
                this.ls.showHidden = true;
            }

            if( params.some((p) => /-[^ ]*l[^ ]*/.test(p)) ){        
                this.output = children.filter((child) => !child.data?.hidden || params.some((p) => /-[^ ]*a[^ ]*/.test(p))).map((child) => {
                    return `${child.data.rights}  ${child.data.user}  ${child.data.group}  ${child.data.date}  ${child.data.name}`.replaceAll(" ", "&nbsp;")
                }).join('\n');
            }
            else if(params.includes("-a")){
                this.output = children.filter((child) => !child.data?.hidden || params.includes("-a")).map((child) => {
                    return child.data.name
                }).join('\n');
            }
            else if( params.length == 0 ){
                this.output = children.filter((child) => !child.data.hidden).map((child) => child.data.name).join('\n');
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
                    this.folderTreeData = this.root.data;

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
                this.folderTreeData = this.root.data
            }

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


            let children = this.currentNode.children || this.currentNode._children;
            
            let index = 0;
            for (let index = 0; index < params.length; index++) {
                
                const element = params[index]; 
                
                if(!element.includes("-")){// not option
                    if(!params.includes("-r") ){
                        index = children.findIndex((child) => child.data.name === element && child.data.type !== "d");
                    }
                    else{
                        index = children.findIndex((child) => child.data.name === element);
                    }

                    if (index === -1) {
                        this.output = `Erreur : Élément '${element}' introuvable`;
                        this.listDirectory()
                        return;
                    }
                    
                    children.splice(index, 1);
                }
            }
            this.listDirectory()
            // this.updateTree(this.currentNode);
            this.output = `Élément '${params}' supprimé avec succès`;
        },
        getPath(node) {
            if (node.parent) {
                return `${this.getPath(node.parent)}/${node.data.name}`;
            }
            return node.data.name;
        },
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
                    .v-list-item-subtitle {
                        font-family: 'Roboto Mono', monospace;
                        display: table-caption;
                        width: 100%;
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

    .box-show {
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
