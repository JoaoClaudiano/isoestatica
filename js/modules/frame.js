// Módulo para análise de pórticos planos isostáticos
class FrameModule {
    constructor(structure) {
        this.structure = structure;
    }

    checkIsostaticity() {
        // Para pórticos planos: fórmula m = 2j - 3
        const m = this.structure.beams.length;
        const j = this.structure.nodes.length;
        let r = 0;
        
        // Contar restrições dos apoios
        this.structure.nodes.forEach(node => {
            if (node.support) {
                switch(node.support.type) {
                    case 'roller':
                        r += 1;
                        break;
                    case 'pinned':
                        r += 2;
                        break;
                    case 'fixed':
                        r += 3;
                        break;
                    case 'hinge':
                        r += 2;
                        break;
                }
            }
        });
        
        // Verificar se há rótulas internas
        const internalHinges = this.structure.nodes.filter(n => 
            n.support && n.support.type === 'hinge' && 
            this.isInternalNode(n)
        ).length;
        
        // Ajustar fórmula para rótulas internas
        const isostatic = (3 * m + r) === (3 * j + internalHinges);
        
        return isostatic;
    }

    isInternalNode(node) {
        // Verificar se o nó é interno (não é apoio externo)
        const connectedBeams = this.structure.beams.filter(b => 
            b.start === node || b.end === node
        );
        return connectedBeams.length > 1;
    }

    calculateReactions() {
        // Implementação para pórticos
        // Resolver sistema de equações de equilíbrio
        const reactions = {};
        
        // Inicializar sistema de equações
        const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        const B = [0, 0, 0];
        
        // Coletar forças aplicadas
        let sumFx = 0, sumFy = 0, sumMz = 0;
        
        this.structure.nodes.forEach(node => {
            node.loads.forEach(load => {
                const angle = Utils.degToRad(load.direction);
                const fx = load.magnitude * Math.cos(angle);
                const fy = load.magnitude * Math.sin(angle);
                
                sumFx += fx;
                sumFy += fy;
                sumMz += (fy * node.x - fx * node.y);
            });
        });
        
        // Construir sistema baseado nos apoios
        const supportNodes = this.structure.nodes.filter(n => n.support);
        
        // Para simplificação, vamos retornar reações nulas por enquanto
        supportNodes.forEach(node => {
            reactions[node.id] = { Fx: 0, Fy: 0, Mz: 0 };
        });
        
        return reactions;
    }

    calculateInternalForces(reactions) {
        // Similar ao beam module, mas considerando múltiplas barras
        const internalForces = {
            beams: {},
            extremes: {
                normal: { max: -Infinity, min: Infinity },
                shear: { max: -Infinity, min: Infinity },
                moment: { max: -Infinity, min: Infinity }
            }
        };
        
        // Calcular para cada barra
        this.structure.beams.forEach(beam => {
            const beamForces = this.calculateBeamForces(beam, reactions);
            internalForces.beams[beam.id] = beamForces;
            
            // Atualizar extremos
            this.updateExtremes(internalForces.extremes, beamForces);
        });
        
        return internalForces;
    }

    calculateBeamForces(beam, reactions) {
        // Implementação simplificada
        const forces = {
            normal: [],
            shear: [],
            moment: []
        };
        
        const nPoints = 101;
        for (let i = 0; i < nPoints; i++) {
            const t = i / (nPoints - 1);
            
            // Valores de exemplo
            const normal = 10 * Math.sin(t * Math.PI);
            const shear = 20 * (0.5 - t);
            const moment = 15 * t * (1 - t);
            
            forces.normal.push({ x: t, value: normal });
            forces.shear.push({ x: t, value: shear });
            forces.moment.push({ x: t, value: moment });
        }
        
        return forces;
    }

    updateExtremes(extremes, beamForces) {
        ['normal', 'shear', 'moment'].forEach(type => {
            beamForces[type].forEach(point => {
                extremes[type].max = Math.max(extremes[type].max, point.value);
                extremes[type].min = Math.min(extremes[type].min, point.value);
            });
        });
    }
}

window.FrameModule = FrameModule;
