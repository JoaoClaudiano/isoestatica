// Modelo básico de estrutura
class Node {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.support = null;
        this.loads = [];
    }
}
class Beam {
    constructor(id, startNode, endNode) {
        this.id = id;
        this.start = startNode;
        this.end = endNode;
    }
}

class Structure {
    constructor() {
        this.nodes = [];
        this.beams = [];
        this.nextNodeId = 1;
        this.nextBeamId = 1;
    }
    
    addNode(x, y) {
        const node = new Node(this.nextNodeId++, x, y);
        this.nodes.push(node);
        return node;
    }
    
    addBeam(startNode, endNode) {
        const beam = new Beam(this.nextBeamId++, startNode, endNode);
        this.beams.push(beam);
        return beam;
    }
    
    addSupport(node, type) {
        if (node) node.support = { type };
    }
    
    addPointLoad(node, magnitude, direction) {
        if (node) {
            node.loads.push({
                type: 'point',
                magnitude,
                direction
            });
        }
    }
}

// Classes específicas
class BeamStructure extends Structure {
    constructor() {
        super();
        this.type = 'beam';
    }
}

class FrameStructure extends Structure {
    constructor() {
        super();
        this.type = 'frame';
    }
}

class GridStructure extends Structure {
    constructor() {
        super();
        this.type = 'grid';
    }
}

class ArchStructure extends Structure {
    constructor() {
        super();
        this.type = 'arch';
    }
}
