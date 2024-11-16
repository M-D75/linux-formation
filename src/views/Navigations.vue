<template>
    <v-container>
      <div id="tree" ref="tree"></div>
      <div style="margin-top: 20px;">
        <v-text-field
          v-model="command"
          variant="outlined"
          label="Entrez une commande (cd, ls, mkdir, touch)"
          @keyup.enter="executeCommand"
          placeholder="Par exemple : cd home"
        ></v-text-field>
        <!-- <v-btn @click="executeCommand">Exécuter</v-btn> -->
        <div style="margin-top: 10px;">
          <strong>Sortie :</strong>
          <div v-html="output"></div>
        </div>
      </div>
    </v-container>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import { folderTree } from '../data/folderTree';
  
  export default {
    name: 'FolderTree',
    data() {
        return {
            root: null,
            pwd: "",
            command: '',
            output: '',
            currentNode: null, // Le dossier courant
            folderTreeData: JSON.parse(JSON.stringify(folderTree)), // Copie locale de folderTree
        };
    },
    mounted() {
        this.createTree();
       
       
    },
    methods: {
        createTree() {
            const width = 1500;
            const height = 600;
            let i = 0;

            d3.select(this.$refs.tree).select("svg").remove()
            const svg = d3
                .select(this.$refs.tree)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [-100, -100, width + 100, height + 100])
                .style('overflow', 'visible');
    
            const root = d3.hierarchy(this.folderTreeData);
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
                const treeLayout = d3.tree().size([height, width - 400]);
                treeLayout(root);
    
                const nodes = root.descendants();
                const node = svg.selectAll('g.node').data(nodes, (d) => d.id || (d.id = ++i));
    
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
                    .attr('class', 'node')
                    .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
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
    
                nodeEnter.each(function(d) {
                    // Vérifier la valeur de 'type' pour chaque nœud
                    if (d.data.type == 'd') {
                        d3.select(this)
                            .append('circle')
                            .attr('r', 20)
                            .attr('fill', (d) => (d._children ? 'lightsteelblue' : '#fff'))
                            .attr('stroke', 'steelblue')
                            .attr('stroke-width', 2);
                    } 
                    else{
                        d3.select(this)
                            .append('rect')
                            .attr('width', 20)
                            .attr('height', 20)
                            .attr('x', -10) // Pour centrer le carré
                            .attr('y', -10) // Pour centrer le carré
                            .style('fill', 'none')
                            .attr('stroke', 'steelblue')
                            .attr('stroke-width', 2)
                            .style('fill-opacity', 0.3);
                    }
                });
                // nodeEnter
                //     .append('circle')
                //     .attr('r', 10)
                //     .attr('fill', (d) => (d._children ? 'lightsteelblue' : '#fff'))
                //     .attr('stroke', 'steelblue')
                //     .attr('stroke-width', 2);
    
                nodeEnter
                    .append('text')
                    .attr('dy', '.35em')
                    .attr('x', (d) => (d.children || d._children ? -25 : 25))
                    .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
                    .text((d) => d.data.name)
                    .attr('font-size', '17px')
                    .style('user-select', 'none');
    
                // Mise à jour des nœuds existants
                const nodeUpdate = nodeEnter.merge(node);
    
                // Transition des nœuds vers leur nouvelle position
                nodeUpdate
                    .transition()
                    .duration(750)
                    .attr('transform', (d) => `translate(${d.y},${d.x})`);
    
                // Mettre à jour les cercles pour refléter l'état du dossier courant
                nodeUpdate
                    .select('circle')
                    .transition()
                    .duration(750)
                    .attr('fill', (d) => {
                        if (d.id == this.currentNode?.id) {
                            console.log('Node updated to current:', d.data.name);
                            return 'orange';
                        }
                        return d._children ? 'lightsteelblue' : '#fff';
                    })
                    .attr('stroke-width', (d) => (d.id == this.currentNode?.id ? 4 : 2))
                    .attr('stroke', (d) => (d.id == this.currentNode?.id ? 'black' : 'steelblue'));
    
                // Ajouter une classe au noeud courant pour un style distinctif
                // nodeUpdate.classed('current-node', (d) => d.id === this.currentNode?.id);
    
                // Liens entre les nœuds
                const links = root.links();
                const link = svg.selectAll('path.link').data(links, (d) => d.target.id);
    
                // Supprimer les anciens liens
                link
                    .exit()
                    .transition()
                    .duration(750)
                    .attr('d', (d) => {
                        const o = { x: source.x, y: source.y };
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
            // console.log("node", node, node.data, node.data.name);
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
            const param = args[1];
    
            switch (cmd) {
                case 'cd':
                    this.changeDirectory(param);
                    break;
                case 'ls':
                    this.listDirectory();
                    break;
                case 'mkdir':
                    this.makeDirectory(param);
                    break;
                case 'touch':
                    this.createFile(param);
                    break;
                default:
                    this.output = `Commande inconnue : ${cmd}`;
            }
    
            this.command = ''; // Réinitialiser le champ de commande
        },
        changeDirectory(_dirName) {
            if(!_dirName){
                this.currentNode = this.root;
                this.changeDirectory("home/user")
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
                            // Replier le répertoire courant
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
                            // Trouver le répertoire dans les enfants ou les _children (les enfants cachés)
                            const found = this.currentNode.children?.find((d) => d.data.name === dirName && d.data.type == "d") || this.currentNode._children?.find((d) => d.data.name === dirName &&  d.data.type == "d");
                            
                            if (found) {
                                // Si le répertoire est trouvé et n'était pas encore déplié, le déplier
                                if (this.currentNode._children && !this.currentNode.children) {
                                    this.currentNode.children = this.currentNode._children;
                                    this.currentNode._children = null;
                                }
                                // Replier tous les sous-dossiers des enfants du répertoire trouvé
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
                                return;
                            }
                        }
                    }
                }
            }

            this.output = `Dossier actuel : ${this.currentNode.data.name}`;
            console.log('Current directory changed to:', this.currentNode.data.name);
            this.updateTree(this.currentNode); // Mettre à jour l'arborescence pour refléter le changement de dossier courant
        },
        listDirectory() {
            const children = this.currentNode.children || this.currentNode._children || [];
            
            if (this.currentNode._children) {
                this.currentNode.children = this.currentNode._children;
                this.currentNode._children = null;
            }

            this.output = children.map((child) => child.data.name).join(', ');
            this.updateTree(this.currentNode); // Déplier si nécessaire
        },
        makeDirectory(dirName) {
            if (!dirName) {
                this.output = 'Nom de dossier requis';
                return;
            }

            // Ajouter le nouveau dossier au folderTreeData
            const targetNode = this.findNodeInTree(d3.hierarchy(this.folderTreeData), this.currentNode.data.name, this.currentNode.depth);
            if (targetNode) {
                if (!targetNode.children) {
                    targetNode.children = [];
                }
                targetNode.children.push({ name: dirName, children: [], type: "d" });
                targetNode.data.children.push({ name: dirName, children: [], type: "d" });
            }
            this.folderTreeData = this.root.data
            console.log("targetNode", targetNode);
            let pwd = this.pwdNode(targetNode, targetNode.data.name, targetNode.depth, "")
            this.pwd = pwd.replace("/root", "")

            // Recréer l'arborescence D3 après la mise à jour du folderTreeData
            this.createTree();
            // this.setCurrentNodeAfterTreeUpdate(targetNode.data.name, targetNode.depth); // Repositionner le currentNode
            this.output = `Dossier créé : ${dirName}`;
        },
        createFile(fileName) {
            if (!fileName) {
                this.output = 'Nom de fichier requis';
                return;
            }
            
            // Ajouter le nouveau fichier au folderTreeData
            const targetNode = this.findNodeInTree(d3.hierarchy(this.folderTreeData), this.currentNode.data.name, this.currentNode.depth);
            if (targetNode) {
                if (!targetNode.children) {
                    targetNode.children = [];
                }
                targetNode.children.push({ name: fileName, children: null });
                targetNode.data.children.push({ name: fileName, children: null });
            }
            this.folderTreeData = this.root.data
            console.log("targetNode", targetNode, this.folderTreeData);
            let pwd = this.pwdNode(targetNode, targetNode.data.name, targetNode.depth, "")
            this.pwd = pwd.replace("/root", "")
            
            // Recréer l'arborescence D3 après la mise à jour du folderTreeData
            this.createTree();
            
            // this.setCurrentNodeAfterTreeUpdate(this.currentNode.data.name, this.currentNode.depth); // Repositionner le currentNode
            this.output = `Fichier créé : ${fileName}`;
        },
        setCurrentNodeAfterTreeUpdate(nodeName, depth) {
            const root = d3.hierarchy(this.folderTreeData);
            console.log("hihi", root, nodeName, depth);
            
            const cc = this.findNodeInTree(root, nodeName, depth);
            console.log("cc", cc);
            // this.updateTree(this.currentNode)
        },
        pwdNode(node, nodeName, depth, chain){
            if (node.parent != null && chain != undefined && node != undefined) {
                for (let parent of node.parent) {
                    chain = this.pwdNode(parent, nodeName, depth, chain);
                    return chain+"/"+node.data.name;
                }
            }
            return chain+"/"+node.data.name;
        }
    },
  };
</script>
  
<style lang="scss" model>
    #tree {
        margin: auto;
        width: 95%;
        svg {
            border: 1px solid #ddd;
            width: 100% !important;
        }
    }
</style>

<style scoped>
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
