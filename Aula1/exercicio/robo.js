// --------------------------------------------------
// 0. INICIALIZAÇÃO
// --------------------------------------------------

const canvasRobo = document.getElementById("robo");
const glRobo = canvasRobo.getContext("webgl2");

if (!glRobo) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VÉRTICES
// --------------------------------------------------

// Constantes da cabeça
const CABECA_LARG = 0.62;     // semi-largura do quadrado cinza
const CABECA_TOPO = 0.50;     // borda de cima da cabeça
const CABECA_BASE = -0.80;    // borda de baixo da cabeça

// Constantes das antenas
const ANTENA_X      = 0.33;   // distância horizontal do centro até cada antena
const ANTENA_TOPO   = 0.72;   // altura onde a haste termina
const BOLINHA_RAIO  = 0.09;   // raio da bolinha na ponta da haste
const BOLINHA_LADOS = 24;     // resolução do círculo da bolinha

// Constantes dos olhos
const OLHO_X    = 0.26;       // distância horizontal do centro até cada olho
const OLHO_Y    = 0.09;       // altura dos olhos
const OLHO_LADO = 0.13;       // semi-lado do quadrado do olho

// Constantes da boca
const BOCA_LARG = 0.40;       // semi-largura do retângulo da boca
const BOCA_ALT  = 0.11;       // semi-altura do retângulo da boca
const BOCA_Y    = -0.45;      // altura da boca

// Função que devolve dois triângulos (6 vértices) formando um retângulo
function retanguloRobo(cx, cy, sx, sy) {

    const x0 = cx - sx;
    const x1 = cx + sx;
    const y0 = cy - sy;
    const y1 = cy + sy;

    return [
        x0, y0,
        x1, y0,
        x1, y1,

        x0, y0,
        x1, y1,
        x0, y1
    ];
}

// Função para gerar a cabeça, esticada entre o topo e a base
function cabecaVertices() {

    const centroY = (CABECA_TOPO + CABECA_BASE) / 2;
    const semiY   = (CABECA_TOPO - CABECA_BASE) / 2;

    return new Float32Array(
        retanguloRobo(0.0, centroY, CABECA_LARG, semiY)
    );
}

// Função para gerar o contorno da cabeça, só os 4 cantos em sequência
function contornoVertices() {

    return new Float32Array([
        -CABECA_LARG, CABECA_BASE,
         CABECA_LARG, CABECA_BASE,
         CABECA_LARG, CABECA_TOPO,
        -CABECA_LARG, CABECA_TOPO
    ]);
}

// Função para gerar as hastes das antenas, começando dentro da cabeça
function antenasVertices() {

    return new Float32Array([
        -ANTENA_X, CABECA_TOPO - 0.05,
        -ANTENA_X, ANTENA_TOPO,

         ANTENA_X, CABECA_TOPO - 0.05,
         ANTENA_X, ANTENA_TOPO
    ]);
}

// Função para gerar as duas bolinhas das antenas como fatias de triângulo
function bolinhasVertices() {

    const v = [];

    for (const cx of [-ANTENA_X, ANTENA_X]) {

        for (let i = 0; i < BOLINHA_LADOS; i++) {

            const a1 = i * 2 * Math.PI / BOLINHA_LADOS;
            const a2 = (i + 1) * 2 * Math.PI / BOLINHA_LADOS;

            v.push(
                cx, ANTENA_TOPO,

                cx + BOLINHA_RAIO * Math.cos(a1),
                ANTENA_TOPO + BOLINHA_RAIO * Math.sin(a1),

                cx + BOLINHA_RAIO * Math.cos(a2),
                ANTENA_TOPO + BOLINHA_RAIO * Math.sin(a2)
            );
        }
    }

    return new Float32Array(v);
}

// Função para gerar os dois olhos quadrados
function olhosVertices() {

    return new Float32Array([
        ...retanguloRobo(-OLHO_X, OLHO_Y, OLHO_LADO, OLHO_LADO),
        ...retanguloRobo( OLHO_X, OLHO_Y, OLHO_LADO, OLHO_LADO)
    ]);
}

// Função para gerar a boca
function bocaVertices() {

    return new Float32Array(
        retanguloRobo(0.0, BOCA_Y, BOCA_LARG, BOCA_ALT)
    );
}


// Gerar os vértices do robô
const verticesCabeca   = cabecaVertices();
const verticesContorno = contornoVertices();
const verticesAntenas  = antenasVertices();
const verticesBolinhas = bolinhasVertices();
const verticesOlhos    = olhosVertices();
const verticesBoca     = bocaVertices();


// Contagem de vértices
const contagemCabeca   = verticesCabeca.length   / 2;   // 6
const contagemContorno = verticesContorno.length / 2;   // 4
const contagemAntenas  = verticesAntenas.length  / 2;   // 4
const contagemBolinhas = verticesBolinhas.length / 2;   // 144
const contagemOlhos    = verticesOlhos.length    / 2;   // 12
const contagemBoca     = verticesBoca.length     / 2;   // 6


// --------------------------------------------------
// 2. BUFFER
// --------------------------------------------------

const bufferAntenas = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferAntenas);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesAntenas,
    glRobo.STATIC_DRAW
);


const bufferBolinhas = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferBolinhas);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesBolinhas,
    glRobo.STATIC_DRAW
);


const bufferCabeca = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferCabeca);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesCabeca,
    glRobo.STATIC_DRAW
);


const bufferContorno = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferContorno);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesContorno,
    glRobo.STATIC_DRAW
);


const bufferOlhos = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferOlhos);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesOlhos,
    glRobo.STATIC_DRAW
);


const bufferBoca = glRobo.createBuffer();

glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferBoca);

glRobo.bufferData(
    glRobo.ARRAY_BUFFER,
    verticesBoca,
    glRobo.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSourceRobo = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

// A cor de cada parte do robô entra por uniform
const fragmentShaderSourceRobo = `#version 300 es

precision mediump float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}

`;


// --------------------------------------------------
// 5. COMPILAR SHADERS
// --------------------------------------------------

function createShaderRobo(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


const vertexShaderRobo = createShaderRobo(
    glRobo,
    glRobo.VERTEX_SHADER,
    vertexShaderSourceRobo
);

const fragmentShaderRobo = createShaderRobo(
    glRobo,
    glRobo.FRAGMENT_SHADER,
    fragmentShaderSourceRobo
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const programRobo = glRobo.createProgram();

glRobo.attachShader(programRobo, vertexShaderRobo);
glRobo.attachShader(programRobo, fragmentShaderRobo);

glRobo.linkProgram(programRobo);

if (!glRobo.getProgramParameter(programRobo, glRobo.LINK_STATUS)) {

    throw new Error(
        glRobo.getProgramInfoLog(programRobo)
    );
}


// --------------------------------------------------
// 7. LOCAL DO ATRIBUTO
// --------------------------------------------------

const positionLocationRobo =
    glRobo.getAttribLocation(
        programRobo,
        "aPosition"
    );

const colorLocationRobo =
    glRobo.getUniformLocation(
        programRobo,
        "uColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTO
// --------------------------------------------------

glRobo.enableVertexAttribArray(positionLocationRobo);


// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

glRobo.clearColor(0.1, 0.4, 1.0, 1.0);

glRobo.clear(glRobo.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

glRobo.useProgram(programRobo);

// ANTENAS: hastes pretas, desenhadas primeiro para a cabeça cobrir a emenda
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferAntenas);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.0, 0.0, 0.0, 1.0);

glRobo.drawArrays(
    glRobo.LINES,
    0,
    contagemAntenas
);


// BOLINHAS: círculos preto nas pontas das antenas
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferBolinhas);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.0, 0.0, 0.0, 1.0);

glRobo.drawArrays(
    glRobo.TRIANGLES,
    0,
    contagemBolinhas
);


// CABEÇA: quadrado cinza, o corpo do robô
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferCabeca);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.5, 0.5, 0.5, 1.0);

glRobo.drawArrays(
    glRobo.TRIANGLES,
    0,
    contagemCabeca
);


// CONTORNO: moldura preta em volta da cabeça
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferContorno);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.0, 0.0, 0.0, 1.0);

glRobo.drawArrays(
    glRobo.LINE_LOOP,
    0,
    contagemContorno
);


// OLHOS: dois quadrados pretos por cima da cabeça
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferOlhos);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.0, 0.0, 0.0, 1.0);

glRobo.drawArrays(
    glRobo.TRIANGLES,
    0,
    contagemOlhos
);


// BOCA: retângulo preto largo, desenhado por último
glRobo.bindBuffer(glRobo.ARRAY_BUFFER, bufferBoca);

glRobo.vertexAttribPointer(
    positionLocationRobo,
    2,
    glRobo.FLOAT,
    false,
    0,
    0
);

glRobo.uniform4f(colorLocationRobo, 0.0, 0.0, 0.0, 1.0);

glRobo.drawArrays(
    glRobo.TRIANGLES,
    0,
    contagemBoca
);