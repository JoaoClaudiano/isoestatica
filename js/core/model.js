// js/core/model.js
class No {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vinc = null;   // Vinculo associado (Apoio, Rótula, Engaste)
        this.cargas = [];   // Cargas aplicadas diretamente no nó
    }
}

class Barra {
    constructor(id, noInicio, noFim) {
        this.id = id;
        this.ni = noInicio;
        this.nf = noFim;
        this.comprimento = Math.sqrt((nf.x - ni.x)**2 + (nf.y - ni.y)**2);
        this.angulo = Math.atan2(nf.y - ni.y, nf.x - ni.x);
        this.cargas = [];   // Cargas distribuídas ou momentuais na barra
    }
}

class Carga {
    constructor(tipo, valor, posicao, direcao) {
        this.tipo = tipo; // 'pontual', 'distribuída', 'momento'
        this.valor = valor;
        this.posicao = posicao; // Coordenada x ou fração do comprimento
        this.direcao = direcao; // Ângulo em radianos
    }
}

class Vinculo {
    constructor(tipo, no, direcao) {
        this.tipo = tipo; // 'apoio_movel', 'apoio_fixo', 'engaste', 'rotula'
        this.no = no;
        this.direcao = direcao; // Para apoios móveis, a direção livre
        this.reacoes = { Rx: null, Ry: null, Mz: null }; // Calculadas
    }
}
