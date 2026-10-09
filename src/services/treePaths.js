// The same cubic curve is used by the tree branches and their directional overlays.
export function treeBranchPath(source, target) {
    const middle = (source.y + target.y) / 2;
    return `M ${source.y} ${source.x} C ${middle} ${source.x}, ${middle} ${target.x}, ${target.y} ${target.x}`;
}

export function treeRoutePath(nodes) {
    return nodes.slice(1).map((node, index) => {
        const segment = treeBranchPath(nodes[index], node);
        return index ? segment.replace(/^M [^C]+C /, 'C ') : segment;
    }).join(' ');
}

// Resolve only expanded branches. Typing must never reveal a hidden node.
export function traceVisibleTreePath(root, current, path) {
    if (!root || !current || !path) return null;
    let node = path.startsWith('/') ? root : current;
    const visible = new Set(root.descendants());
    if (!visible.has(node)) return null;
    const nodes = [node];
    for (const segment of path.split('/').filter(Boolean)) {
        if (segment === '.') continue;
        if (node.data.type !== 'd') return null;
        const next = segment === '..'
            ? node.parent || node
            : node.children?.find(child => child.data.name === segment);
        if (!next || !visible.has(next)) return null;
        if (next !== node) nodes.push(next);
        node = next;
    }
    if (path.endsWith('/') && node.data.type !== 'd') return null;
    return { nodes, target: node };
}

export function commandPathCandidates(tokens) {
    if (!tokens.length) return [];
    const [command, ...args] = tokens;
    const pathCommands = new Set(['cd', 'ls', 'll', 'mkdir', 'touch', 'cp', 'rm', 'chmod', 'cat', 'head', 'tail', 'nano']);
    if (!pathCommands.has(command)) {
        return tokens.length === 1 && !['help', 'pwd', 'whoami', 'id', 'groups', 'man', 'echo'].includes(command)
            ? [command] : [];
    }
    const paths = [];
    let skipValue = command === 'chmod';
    for (const arg of args) {
        if (arg.startsWith('-')) {
            if ((command === 'head' || command === 'tail') && arg === '-n') skipValue = true;
            continue;
        }
        if (skipValue) { skipValue = false; continue; }
        paths.push(arg);
    }
    return paths;
}
