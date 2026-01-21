// Módulo para análise de arcos isostáticos

class ArchModule {
    constructor(structure) {
        this.structure = structure;
    }

    checkIsostaticity() {
        // Similar a pórticos, mas com geometria curva
        const nodes = this.structure.nodes;
        const beams = this.structure.beams;
        
        let supportConditions = 0;
        nodes.forEach(node => {
            if (node.support) {
                switch (node.support.type) {
                    case 'roller':
                        supportConditions += 1;
                        break;
                    case 'pinned':
                        supportConditions += 2;
                        break;
                    case 'fixed':
                        supportConditions += 3;
                        break;
                    case 'hinge':
                        supportConditions += 2;
                        break;
                }
            }
        });

        const m = beams.length;
        const j = nodes.length;
        const r = supportConditions;

        return (3 * m + r) === (3 * j);
    }

    calculateReactions() {
        const reactions = {};
        
        this.structure.nodes.forEach(node => {
            if (node.support) {
                reactions[node.id] = { Fx: 0, Fy: 0, Mz: 0 };
            }
        });

        return reactions;
    }

    calculateInternalForces() {
        const results = {
            beams: {},
            extremes: {
                normal: { max: -Infinity, min: Infinity },
                shear: { max: -Infinity, min: Infinity },
                moment: { max: -Infinity, min: Infinity }
            }
        };

        this.structure.beams.forEach(beam => {
            const beamForces = this.calculateBeamInternalForces(beam);
            results.beams[beam.id] = beamForces;
            this.updateExtremes(results.extremes, beamForces);
        });

        return results;
    }

    calculateBeamInternalForces(beam) {
        const forces = {
            normal: [],
            shear: [],
            moment: []
        };

        // Para arcos, a geometria é importante
        // Vamos considerar um arco parabólico como exemplo
        const nPoints = 101;
        const start = beam.start;
        const end = beam.end;
        
        // Parâmetros da parábola (exemplo)
        const L = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        
        for (let i = 0; i < nPoints; i++) {
            const t = i / (nPoints - 1);
            const x = start.x + t * (end.x - start.x);
            
            // Equação de uma parábola (exemplo)
            const y = start.y + 4 * h * t * (1 - t);
            
            // Esforços de exemplo (seriam calculados com base nas cargas)
            // Para arco parabólico com carga uniforme, o momento é pequeno
            const normal = -50 * Math.cos(t * Math.PI);
            const shear = 10 * Math.sin(t * Math.PI);
            const moment = 5 * t * (1 - t) * L;

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

    // Método específico para arcos: calcular linha de pressão
    calculatePressureLine(loads) {
        // A linha de pressão é o lugar geométrico dos pontos onde o momento fletor é zero
        // Para um arco com carga uniforme, é uma parábola
        const points = [];
        
        // Exemplo: pontos ao longo do arco
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const x = t * 10; // Exemplo: arco de 10m de vão
            const y = 4 * 2 * t * (1 - t); // Flecha de 2m
            
            points.push({ x, y });
        }
        
        return points;
    }
}

window.ArchModule = ArchModule;
