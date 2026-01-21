// Módulo específico para análise de vigas isostáticas
class BeamModule {
    constructor(structure) {
        this.structure = structure;
    }

    // Método para verificar se a viga é isostática
    checkIsostaticity() {
        const nodes = this.structure.nodes;
        const beams = this.structure.beams;
        
        // Contar número de vínculos
        let totalRestraints = 0;
        nodes.forEach(node => {
            if (node.support) {
                switch(node.support.type) {
                    case 'roller':
                        totalRestraints += 1;
                        break;
                    case 'pinned':
                        totalRestraints += 2;
                        break;
                    case 'fixed':
                        totalRestraints += 3;
                        break;
                }
            }
        });
        
        // Para vigas isostáticas: totalRestraints = 3
        const isIsostatic = totalRestraints === 3;
        
        // Verificar também condições de estabilidade
        if (isIsostatic) {
            // Verificar se os apoios não estão alinhados de forma a permitir mecanismo
            const supports = nodes.filter(n => n.support);
            if (supports.length === 2) {
                const supportTypes = supports.map(s => s.support.type);
                // Combinações válidas para vigas isostáticas:
                // - Engaste + livre (balanço)
                // - Fixo + móvel (biapoiada)
                // - Fixo + fixo (hiperestática)
                const validCombinations = [
                    ['fixed', 'none'], // Balanço
                    ['pinned', 'roller'] // Biapoiada
                ];
                
                const currentCombination = supportTypes.sort();
                const isValid = validCombinations.some(comb => 
                    JSON.stringify(comb.sort()) === JSON.stringify(currentCombination)
                );
                
                return isValid;
            }
        }
        
        return isIsostatic;
    }

    // Calcular reações de apoio para vigas
    calculateReactions() {
        const reactions = {};
        const nodes = this.structure.nodes;
        const beams = this.structure.beams;
        
        // Inicializar reações
        nodes.forEach(node => {
            if (node.support) {
                reactions[node.id] = { Fx: 0, Fy: 0, Mz: 0 };
            }
        });
        
        // Para vigas, consideramos apenas cargas no plano XY
        // ΣFx = 0, ΣFy = 0, ΣMz = 0
        
        // Somar todas as forças aplicadas
        let sumFx = 0;
        let sumFy = 0;
        let sumMz = 0;
        
        // Cargas nos nós
        nodes.forEach(node => {
            node.loads.forEach(load => {
                const angle = Utils.degToRad(load.direction);
                const fx = load.magnitude * Math.cos(angle);
                const fy = load.magnitude * Math.sin(angle);
                
                sumFx += fx;
                sumFy += fy;
                sumMz += (fy * node.x - fx * node.y);
            });
        });
        
        // Cargas distribuídas nas barras
        beams.forEach(beam => {
            beam.distributedLoads.forEach(load => {
                const equivalent = this.calculateEquivalentLoad(beam, load);
                sumFx += equivalent.fx;
                sumFy += equivalent.fy;
                sumMz += equivalent.moment;
            });
        });
        
        // Resolver sistema de equações baseado nos tipos de apoio
        const supportNodes = nodes.filter(n => n.support);
        
        if (supportNodes.length === 2) {
            // Viga biapoiada ou balanço
            const nodeA = supportNodes[0];
            const nodeB = supportNodes[1];
            
            if (nodeA.support.type === 'pinned' && nodeB.support.type === 'roller') {
                // Viga biapoiada simples
                const L = Math.abs(nodeB.x - nodeA.x);
                
                // Reações verticais
                reactions[nodeA.id].Fy = (sumFy * nodeB.x - sumMz) / L;
                reactions[nodeB.id].Fy = sumFy - reactions[nodeA.id].Fy;
                
                // Reações horizontais (geralmente zero para cargas verticais)
                reactions[nodeA.id].Fx = -sumFx;
            } else if (nodeA.support.type === 'fixed' && !nodeB.support) {
                // Viga em balanço
                reactions[nodeA.id].Fx = -sumFx;
                reactions[nodeA.id].Fy = -sumFy;
                reactions[nodeA.id].Mz = -sumMz;
            }
        }
        
        return reactions;
    }

    // Calcular carga equivalente para carga distribuída
    calculateEquivalentLoad(beam, distributedLoad) {
        const { qStart, qEnd, startPos, endPos } = distributedLoad;
        
        // Comprimento do trecho carregado
        const startX = beam.start.x + startPos * (beam.end.x - beam.start.x);
        const startY = beam.start.y + startPos * (beam.end.y - beam.start.y);
        const endX = beam.start.x + endPos * (beam.end.x - beam.start.x);
        const endY = beam.start.y + endPos * (beam.end.y - beam.start.y);
        
        const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        
        // Força total (área do trapézio)
        const totalForce = (qStart + qEnd) * length / 2;
        
        // Posição do centroide
        let centroidPos;
        if (qStart === qEnd) {
            centroidPos = startPos + (endPos - startPos) / 2;
        } else {
            centroidPos = startPos + (endPos - startPos) * 
                (2 * qEnd + qStart) / (3 * (qStart + qEnd));
        }
        
        // Coordenadas do ponto de aplicação
        const x = beam.start.x + centroidPos * (beam.end.x - beam.start.x);
        const y = beam.start.y + centroidPos * (beam.end.y - beam.start.y);
        
        // Direção da carga (perpendicular à barra para cargas distribuídas verticais)
        const angle = beam.angle + Math.PI / 2;
        const fx = totalForce * Math.cos(angle);
        const fy = totalForce * Math.sin(angle);
        
        // Momento em relação à origem
        const moment = fx * y - fy * x;
        
        return { fx, fy, moment };
    }

    // Calcular esforços internos
    calculateInternalForces(reactions) {
        const internalForces = {
            beams: {},
            extremes: {
                normal: { max: -Infinity, min: Infinity, position: null },
                shear: { max: -Infinity, min: Infinity, position: null },
                moment: { max: -Infinity, min: Infinity, position: null }
            }
        };
        
        // Para cada barra, calcular diagramas
        this.structure.beams.forEach(beam => {
            const beamForces = this.calculateBeamInternalForces(beam, reactions);
            internalForces.beams[beam.id] = beamForces;
            
            // Atualizar valores extremos
            this.updateExtremes(internalForces.extremes, beamForces);
        });
        
        return internalForces;
    }

    // Calcular esforços internos em uma barra específica
    calculateBeamInternalForces(beam, reactions) {
        const forces = {
            normal: [],
            shear: [],
            moment: []
        };
        
        // Número de pontos para discretização
        const nPoints = 101;
        
        for (let i = 0; i < nPoints; i++) {
            const t = i / (nPoints - 1);
            
            // Calcular esforços neste ponto
            const pointForces = this.calculateForcesAt(beam, t, reactions);
            
            forces.normal.push({ x: t, value: pointForces.normal });
            forces.shear.push({ x: t, value: pointForces.shear });
            forces.moment.push({ x: t, value: pointForces.moment });
        }
        
        return forces;
    }

    // Calcular esforços em um ponto específico da barra
    calculateForcesAt(beam, t, reactions) {
        // Posição no ponto t
        const x = beam.start.x + t * (beam.end.x - beam.start.x);
        const y = beam.start.y + t * (beam.end.y - beam.start.y);
        
        // Inicializar esforços
        let normal = 0;
        let shear = 0;
        let moment = 0;
        
        // Considerar reações à esquerda do ponto
        Object.entries(reactions).forEach(([nodeId, reaction]) => {
            const node = this.structure.getNodeById(parseInt(nodeId));
            if (node && this.isPointToLeft(x, y, node.x, node.y, beam.angle)) {
                // Converter reações para eixos locais da barra
                const localForces = this.globalToLocal(
                    reaction.Fx, reaction.Fy,
                    beam.angle
                );
                
                normal += localForces.normal;
                shear += localForces.shear;
                
                // Momento das reações
                const dx = x - node.x;
                const dy = y - node.y;
                moment += reaction.Mz + (reaction.Fy * dx - reaction.Fx * dy);
            }
        });
        
        // Considerar cargas aplicadas à esquerda do ponto
        this.structure.nodes.forEach(node => {
            if (this.isPointToLeft(x, y, node.x, node.y, beam.angle)) {
                node.loads.forEach(load => {
                    const angle = Utils.degToRad(load.direction);
                    const fx = load.magnitude * Math.cos(angle);
                    const fy = load.magnitude * Math.sin(angle);
                    
                    const localForces = this.globalToLocal(fx, fy, beam.angle);
                    
                    normal += localForces.normal;
                    shear += localForces.shear;
                    
                    const dx = x - node.x;
                    const dy = y - node.y;
                    moment += (fy * dx - fx * dy);
                });
            }
        });
        
        return { normal, shear, moment };
    }

    // Converter forças globais para locais (sistema de coordenadas da barra)
    globalToLocal(fx, fy, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const normal = fx * cos + fy * sin; // Paralelo à barra
        const shear = -fx * sin + fy * cos; // Perpendicular à barra
        
        return { normal, shear };
    }

    // Verificar se um ponto está à esquerda de outro na direção da barra
    isPointToLeft(x, y, refX, refY, angle) {
        const dx = x - refX;
        const dy = y - refY;
        
        // Projeção na direção da barra
        const projection = dx * Math.cos(angle) + dy * Math.sin(angle);
        
        return projection > 0;
    }

    // Atualizar valores extremos
    updateExtremes(extremes, beamForces) {
        ['normal', 'shear', 'moment'].forEach(type => {
            beamForces[type].forEach(point => {
                if (point.value > extremes[type].max) {
                    extremes[type].max = point.value;
                }
                if (point.value < extremes[type].min) {
                    extremes[type].min = point.value;
                }
            });
        });
    }

    // Calcular posições críticas (onde V=0 ou M extremo)
    findCriticalSections(internalForces) {
        const criticalSections = [];
        
        this.structure.beams.forEach(beam => {
            const beamForces = internalForces.beams[beam.id];
            if (!beamForces) return;
            
            // Encontrar onde V = 0 (máximo momento)
            for (let i = 0; i < beamForces.shear.length - 1; i++) {
                const current = beamForces.shear[i];
                const next = beamForces.shear[i + 1];
                
                if (current.value * next.value <= 0) {
                    // Interpolar posição exata
                    const t = current.x + (0 - current.value) * 
                        (next.x - current.x) / (next.value - current.value);
                    
                    const x = beam.start.x + t * (beam.end.x - beam.start.x);
                    const y = beam.start.y + t * (beam.end.y - beam.start.y);
                    
                    // Calcular momento nesta posição
                    const momentIndex = Math.round(t * (beamForces.moment.length - 1));
                    const moment = beamForces.moment[momentIndex].value;
                    
                    criticalSections.push({
                        beamId: beam.id,
                        position: t,
                        x: x,
                        y: y,
                        type: 'zero_shear',
                        moment: moment
                    });
                }
            }
        });
        
        return criticalSections;
    }
}

// Exportar para uso global
window.BeamModule = BeamModule;
