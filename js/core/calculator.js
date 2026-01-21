// Calculadora de estruturas isostáticas
class StructureCalculator {
    constructor() {
        this.epsilon = 1e-6; // Tolerância para comparações numéricas
    }
    
    // Verificar se a estrutura é isostática
    checkIsostaticity(structure) {
        const { nodes, beams } = structure;
        
        // Contar número de incógnitas (reações)
        let reactionCount = 0;
        nodes.forEach(node => {
            if (node.support) {
                switch(node.support.type) {
                    case 'roller':
                        reactionCount += 1; // 1 reação (normal à superfície)
                        break;
                    case 'pinned':
                        reactionCount += 2; // 2 reações (Fx, Fy)
                        break;
                    case 'fixed':
                        reactionCount += 3; // 3 reações (Fx, Fy, Mz)
                        break;
                    case 'hinge':
                        reactionCount += 2; // 2 reações (Fx, Fy)
                        break;
                }
            }
        });
        
        // Para estruturas planas: 3 equações de equilíbrio
        const equilibriumEquations = 3;
        
        // Verificar se número de reações = número de equações
        return reactionCount === equilibriumEquations;
    }
    
    // Calcular grau de estaticidade
    calculateStaticDegree(structure) {
        const { nodes, beams } = structure;
        
        // Graus de liberdade totais
        let degreesOfFreedom = 3 * nodes.length; // Para estruturas planas: 3 por nó
        
        // Restrições dos vínculos
        let constraints = 0;
        nodes.forEach(node => {
            if (node.support) {
                switch(node.support.type) {
                    case 'roller':
                        constraints += 1;
                        break;
                    case 'pinned':
                        constraints += 2;
                        break;
                    case 'fixed':
                        constraints += 3;
                        break;
                    case 'hinge':
                        constraints += 2;
                        break;
                }
            }
        });
        
        // Restrições das barras (cada barra remove 3 graus de liberdade em estruturas planas)
        constraints += 3 * beams.length;
        
        return degreesOfFreedom - constraints;
    }
    
    // Calcular reações de apoio
    calculateReactions(structure) {
        const reactions = {};
        
        // Implementação do método das equações de equilíbrio
        // ΣFx = 0, ΣFy = 0, ΣM = 0
        
        // Coletar todas as forças aplicadas
        let sumFx = 0;
        let sumFy = 0;
        let sumM = 0;
        
        structure.nodes.forEach(node => {
            // Forças aplicadas nos nós
            node.loads.forEach(load => {
                sumFx += load.fx;
                sumFy += load.fy;
                
                // Momento em relação à origem
                sumM += load.fy * node.x - load.fx * node.y;
            });
            
            // Momentos aplicados nos nós
            node.moments.forEach(moment => {
                sumM += moment.magnitude;
            });
        });
        
        // Cargas distribuídas nas barras
        structure.beams.forEach(beam => {
            beam.distributedLoads.forEach(load => {
                // Converter carga distribuída para equivalentes pontuais
                const equivalentForce = this.calculateEquivalentForce(beam, load);
                sumFx += equivalentForce.fx;
                sumFy += equivalentForce.fy;
                sumM += equivalentForce.moment;
            });
        });
        
        // Resolver sistema de equações para as reações
        // Esta é uma implementação simplificada
        // Em uma implementação completa, resolveríamos um sistema linear
        
        // Para exemplo: viga biapoiada simples
        if (structure.type === 'beam' && structure.nodes.length === 2) {
            const nodeA = structure.nodes[0];
            const nodeB = structure.nodes[1];
            
            if (nodeA.support && nodeB.support) {
                // Distância entre apoios
                const L = Math.abs(nodeB.x - nodeA.x);
                
                // Para carga pontual no meio (exemplo)
                const middleNode = structure.nodes.find(n => 
                    n.loads.length > 0 && 
                    Math.abs(n.x - (nodeA.x + nodeB.x) / 2) < this.epsilon
                );
                
                if (middleNode) {
                    const P = middleNode.loads.reduce((sum, load) => sum + load.fy, 0);
                    const a = middleNode.x - nodeA.x;
                    const b = nodeB.x - middleNode.x;
                    
                    // Reações
                    reactions[nodeA.id] = {
                        Fx: 0,
                        Fy: P * b / L,
                        Mz: 0
                    };
                    
                    reactions[nodeB.id] = {
                        Fx: 0,
                        Fy: P * a / L,
                        Mz: 0
                    };
                }
            }
        }
        
        return reactions;
    }
    
    // Calcular força equivalente de carga distribuída
    calculateEquivalentForce(beam, distributedLoad) {
        const { qStart, qEnd, startPos, endPos } = distributedLoad;
        
        // Posições em coordenadas mundiais
        const x1 = beam.start.x + startPos * (beam.end.x - beam.start.x);
        const y1 = beam.start.y + startPos * (beam.end.y - beam.start.y);
        const x2 = beam.start.x + endPos * (beam.end.x - beam.start.x);
        const y2 = beam.start.y + endPos * (beam.end.y - beam.start.y);
        
        // Comprimento do trecho carregado
        const L = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        // Força total (média)
        const Q = (qStart + qEnd) * L / 2;
        
        // Ponto de aplicação (centroide)
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        
        // Direção (normal à barra para carga distribuída vertical)
        const angle = beam.angle + Math.PI / 2;
        
        return {
            fx: Q * Math.cos(angle),
            fy: Q * Math.sin(angle),
            moment: Q * (xc * Math.sin(angle) - yc * Math.cos(angle))
        };
    }
    
    // Calcular esforços internos
    calculateInternalForces(structure) {
        const internalForces = {
            beams: {},
            extremes: {
                normal: { max: -Infinity, min: Infinity },
                shear: { max: -Infinity, min: Infinity },
                moment: { max: -Infinity, min: Infinity },
                torsion: { max: -Infinity, min: Infinity }
            }
        };
        
        // Para cada barra, calcular diagramas
        structure.beams.forEach(beam => {
            const forces = this.calculateBeamInternalForces(beam, structure);
            internalForces.beams[beam.id] = forces;
            
            // Atualizar extremos
            this.updateExtremes(internalForces.extremes, forces);
        });
        
        return internalForces;
    }
    
    // Calcular esforços internos em uma barra
    calculateBeamInternalForces(beam, structure) {
        const forces = {
            normal: [],
            shear: [],
            moment: [],
            torsion: []
        };
        
        // Número de pontos para discretização
        const nPoints = 101;
        
        for (let i = 0; i < nPoints; i++) {
            const t = i / (nPoints - 1); // Parâmetro de 0 a 1
            
            // Calcular esforços neste ponto
            const pointForces = this.calculateForcesAt(beam, t, structure);
            
            forces.normal.push({
                x: t,
                value: pointForces.normal
            });
            
            forces.shear.push({
                x: t,
                value: pointForces.shear
            });
            
            forces.moment.push({
                x: t,
                value: pointForces.moment
            });
            
            if (structure.type === 'grid') {
                forces.torsion.push({
                    x: t,
                    value: pointForces.torsion
                });
            }
        }
        
        return forces;
    }
    
    // Calcular esforços em um ponto específico da barra
    calculateForcesAt(beam, t, structure) {
        // Implementação simplificada para exemplo
        // Em implementação real: integrar cargas e usar condições de equilíbrio
        
        const x = beam.start.x + t * (beam.end.x - beam.start.x);
        const y = beam.start.y + t * (beam.end.y - beam.start.y);
        
        // Para exemplo: viga simples com carga pontual no meio
        if (structure.type === 'beam' && structure.nodes.length === 2) {
            const L = beam.length;
            const a = L / 2; // Carga no meio (simplificado)
            
            let normal = 0;
            let shear = 0;
            let moment = 0;
            
            if (t <= 0.5) {
                // Trecho à esquerda da carga
                shear = 5; // Reação esquerda (simplificado)
                moment = 5 * t * L; // Linear
            } else {
                // Trecho à direita da carga
                shear = -5; // Cortante negativo
                moment = 5 * (1 - t) * L; // Linear decrescente
            }
            
            return { normal, shear, moment, torsion: 0 };
        }
        
        return { normal: 0, shear: 0, moment: 0, torsion: 0 };
    }
    
    // Atualizar valores extremos
    updateExtremes(extremes, forces) {
        // Normal
        forces.normal.forEach(point => {
            extremes.normal.max = Math.max(extremes.normal.max, point.value);
            extremes.normal.min = Math.min(extremes.normal.min, point.value);
        });
        
        // Cortante
        forces.shear.forEach(point => {
            extremes.shear.max = Math.max(extremes.shear.max, point.value);
            extremes.shear.min = Math.min(extremes.shear.min, point.value);
        });
        
        // Momento
        forces.moment.forEach(point => {
            extremes.moment.max = Math.max(extremes.moment.max, point.value);
            extremes.moment.min = Math.min(extremes.moment.min, point.value);
        });
        
        // Torção (se existir)
        if (forces.torsion) {
            forces.torsion.forEach(point => {
                extremes.torsion.max = Math.max(extremes.torsion.max, point.value);
                extremes.torsion.min = Math.min(extremes.torsion.min, point.value);
            });
        }
    }
}
