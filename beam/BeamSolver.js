// SOLUCIONADOR DE VIGAS
class BeamSolver {
    constructor() {
        this.math = math;
    }
    
    calculate(beamData) {
        const { length, elements, units } = beamData;
        
        // Separar elementos por tipo
        const supports = elements.filter(e => e.type.startsWith('support'));
        const loads = elements.filter(e => e.type.startsWith('load'));
        const moments = elements.filter(e => e.type === 'moment');
        
        // Verificar se é uma viga isostática
        if (supports.length !== 2) {
            throw new Error(`Viga deve ter 2 apoios para análise isostática (encontrados: ${supports.length})`);
        }
        
        // Ordenar apoios por posição
        supports.sort((a, b) => a.position - b.position);
        
        // Extrair posições dos apoios
        const A = supports[0].position;
        const B = supports[1].position;
        
        // Somatório de forças verticais
        let sumForces = 0;
        let sumMoments = 0;
        
        // Processar cargas concentradas
        loads.forEach(load => {
            if (load.type === 'load_concentrated') {
                const force = load.direction === 'up' ? load.value : -load.value;
                sumForces += force;
                sumMoments += force * load.position;
            } else if (load.type === 'load_distributed') {
                // Carga distribuída: converter em força equivalente
                const w = load.value; // kN/m
                const L = load.length || 0;
                const start = load.position;
                const end = start + L;
                
                // Força total
                const totalForce = w * L;
                const force = load.direction === 'up' ? totalForce : -totalForce;
                
                // Posição do centroide
                const centroid = start + L/2;
                
                sumForces += force;
                sumMoments += force * centroid;
            }
        });
        
        // Processar momentos
        moments.forEach(moment => {
            // Momentos não contribuem para ΣFy
            sumMoments += moment.value;
        });
        
        // Resolver sistema de equações:
        // ΣFy = 0 => Ra + Rb + ΣF = 0
        // ΣM(A) = 0 => Rb*(B-A) + ΣM = 0
        
        const distanceAB = B - A;
        
        if (distanceAB === 0) {
            throw new Error('Apoios não podem estar na mesma posição');
        }
        
        // Calcular reações
        const Rb = -sumMoments / distanceAB;
        const Ra = -sumForces - Rb;
        
        // Verificar equilíbrio
        const checkForces = Ra + Rb + sumForces;
        const checkMomentsA = Rb * distanceAB + sumMoments;
        
        return {
            reactions: [
                { position: A, value: Ra },
                { position: B, value: Rb }
            ],
            sumForces: checkForces,
            sumMoments: checkMomentsA,
            equilibrium: Math.abs(checkForces) < 0.001 && Math.abs(checkMomentsA) < 0.001,
            units: units
        };
    }
    
    calculateInternalForces(beamData, x) {
        // Calcular forças internas em uma posição x
        const { elements } = beamData;
        const reactions = this.calculate(beamData).reactions;
        
        let V = 0; // Cortante
        let M = 0; // Momento
        let N = 0; // Normal (assumindo zero para cargas verticais)
        
        // Adicionar contribuição das reações
        reactions.forEach(reaction => {
            if (reaction.position < x) {
                V += reaction.value;
                M += reaction.value * (x - reaction.position);
            }
        });
        
        // Adicionar contribuição das cargas
        elements.forEach(element => {
            if (element.position < x) {
                if (element.type === 'load_concentrated') {
                    const force = element.direction === 'up' ? element.value : -element.value;
                    V += force;
                    M += force * (x - element.position);
                } else if (element.type === 'load_distributed') {
                    const w = element.value;
                    const start = element.position;
                    const end = start + (element.length || 0);
                    
                    if (x > start) {
                        const effectiveLength = Math.min(x, end) - start;
                        const force = w * effectiveLength;
                        V += (element.direction === 'up' ? force : -force);
                        M += (element.direction === 'up' ? force : -force) * (x - (start + effectiveLength/2));
                    }
                } else if (element.type === 'moment') {
                    // Momento concentrado
                    M += element.value;
                }
            }
        });
        
        return { V, M, N };
    }
    
    calculateDiagrams(beamData, points = 100) {
        const results = [];
        const dx = beamData.length / points;
        
        for (let i = 0; i <= points; i++) {
            const x = i * dx;
            const forces = this.calculateInternalForces(beamData, x);
            results.push({
                position: x,
                shear: forces.V,
                moment: forces.M,
                normal: forces.N
            });
        }
        
        return results;
    }
}