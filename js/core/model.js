// Modelo de dados para estruturas isostáticas

class Node {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.support = null;
        this.loads = [];
        this.moments = [];
        this.displacement = { dx: 0, dy: 0, rz: 0 };
        this.reactions = { Fx: 0, Fy: 0, Mz: 0 };
    }
    
    addSupport(type, direction = null) {
        this.support = { type, direction };
    }
    
    addLoad(magnitude, direction, type = 'point') {
        this.loads.push({
            type,
            magnitude,
            direction: direction * Math.PI / 180, // Converter para radianos
            fx: magnitude * Math.cos(direction * Math.PI / 180),
            fy: magnitude * Math.sin(direction * Math.PI / 180)
        });
    }
    
    addMoment(magnitude) {
        this.moments.push({ magnitude });
    }
}

class Beam {
    constructor(id, startNode, endNode) {
        this.id = id;
        this.start = startNode;
        this.end = endNode;
        this.length = Math.sqrt(
            (endNode.x - startNode.x) ** 2 + 
            (endNode.y - startNode.y) ** 2
        );
        this.angle = Math.atan2(
            endNode.y - startNode.y,
            endNode.x - startNode.x
        );
        this.distributedLoads = [];
        this.internalForces = {
            normal: [],
            shear: [],
            moment: [],
            torsion: []
        };
    }
    
    addDistributedLoad(qStart, qEnd, startPos = 0, endPos = 1) {
        this.distributedLoads.push({
            qStart,
            qEnd,
            startPos, // Posição relativa (0 a 1)
            endPos    // Posição relativa (0 a 1)
        });
    }
    
    calculateInternalForcesAt(position) {
        // Calcular esforços internos em uma posição específica da barra
        // Implementação específica para cada tipo de estrutura
        return {
            normal: 0,
            shear: 0,
            moment: 0,
            torsion: 0
        };
    }
}

class Structure {
    constructor() {
        this.nodes = [];
        this.beams = [];
        this.reactions = {};
        this.internalForces = {};
        this.isIsostatic = null;
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
    
    addSupport(node, type, direction = null) {
        node.addSupport(type, direction);
    }
    
    addPointLoad(node, magnitude, direction) {
        node.addLoad(magnitude, direction, 'point');
    }
    
    addDistributedLoad(beam, qStart, qEnd, startPos, endPos) {
        beam.addDistributedLoad(qStart, qEnd, startPos, endPos);
    }
    
    addMoment(node, magnitude) {
        node.addMoment(magnitude);
    }
    
    getNodeById(id) {
        return this.nodes.find(node => node.id === id);
    }
    
    getBeamById(id) {
        return this.beams.find(beam => beam.id === id);
    }
    
    clear() {
        this.nodes = [];
        this.beams = [];
        this.reactions = {};
        this.internalForces = {};
        this.nextNodeId = 1;
        this.nextBeamId = 1;
    }
    
    getBounds() {
        if (this.nodes.length === 0) {
            return { minX: -5, maxX: 5, minY: -5, maxY: 5 };
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        // Adicionar margem
        const margin = Math.max(2, (maxX - minX) * 0.1, (maxY - minY) * 0.1);
        
        return {
            minX: minX - margin,
            maxX: maxX + margin,
            minY: minY - margin,
            maxY: maxY + margin
        };
    }
}

// Classes específicas para cada tipo de estrutura
class BeamStructure extends Structure {
    constructor() {
        super();
        this.type = 'beam';
    }
    
    // Métodos específicos para vigas
    calculateReactions() {
        // Implementação específica para vigas
        return {};
    }
}

class FrameStructure extends Structure {
    constructor() {
        super();
        this.type = 'frame';
    }
    
    // Métodos específicos para pórticos
}

class GridStructure extends Structure {
    constructor() {
        super();
        this.type = 'grid';
    }
    
    // Métodos específicos para grelhas
}

class ArchStructure extends Structure {
    constructor() {
        super();
        this.type = 'arch';
    }
    
    // Métodos específicos para arcos
}
