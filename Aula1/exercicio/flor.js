// --------------------------------------------------
// 0. INICIALIZAÇÃO
// --------------------------------------------------

const canvasFlor = document.getElementById("flor");
const glFlor = canvasFlor.getContext("webgl2");

if (!glFlor) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VÉRTICES
// --------------------------------------------------

// Constantes da flor
const MIOLO_RAIO    = 0.2;    // raio do círculo amarelo
const MIOLO_LADOS   = 40;     // Número de vértices do círculo

const NUM_PETALAS   = 5;      // quantas pétalas em volta
const PETALA_DIST   = 0.4;    // distância do centro da flor ao centro da pétala
const PETALA_COMP   = 0.3;    // semi-eixo do comprimento (aponta para fora)
const PETALA_LARG   = 0.15;    // semi-eixo da largura
const PETALA_FATIAS = 16;     // resolução de cada pétala

const CAULE_TOPO    = -0.15;  // começa DENTRO do miolo, para não aparecer emenda
const CAULE_BASE    = -0.9;   // base do caule

// Função para rotacionar um ponto (x, y) em torno da origem
function rotacionar(x, y, angulo) {

    const c = Math.cos(angulo);
    const s = Math.sin(angulo);

    return [
        x * c - y * s,
        x * s + y * c
    ];
}

// Função para gerar o círculo do miolo da flor
function mioloVertices() {

    const v = [0.0, 0.0];

    for (let i = 0; i <= MIOLO_LADOS; i++) {

        const angulo = i * 2 * Math.PI / MIOLO_LADOS;

        v.push(
            MIOLO_RAIO * Math.cos(angulo),
            MIOLO_RAIO * Math.sin(angulo)
        );
    }

    return new Float32Array(v);
}

// Função para gerar as pétalas da flor
function petalasVertices() {

    const v = [];

    for (let k = 0; k < NUM_PETALAS; k++) {

        const theta = k * 2 * Math.PI / NUM_PETALAS + Math.PI / 2;

        // O centro da elipse também tem que ser rotacionado.
        const centro = rotacionar(PETALA_DIST, 0.0, theta);

        for (let i = 0; i < PETALA_FATIAS; i++) {

            const phi1 = i * 2 * Math.PI / PETALA_FATIAS;
            const phi2 = (i + 1) * 2 * Math.PI / PETALA_FATIAS;

            const p1 = rotacionar(
                PETALA_DIST + PETALA_COMP * Math.cos(phi1),
                PETALA_LARG * Math.sin(phi1),
                theta
            );

            const p2 = rotacionar(
                PETALA_DIST + PETALA_COMP * Math.cos(phi2),
                PETALA_LARG * Math.sin(phi2),
                theta
            );

            v.push(
                centro[0], centro[1],
                p1[0],     p1[1],
                p2[0],     p2[1]
            );
        }
    }

    return new Float32Array(v);
}

// Função para gerar o caule da flor
function cauleVertices() {

    return new Float32Array([
        0.0, CAULE_TOPO,
        0.0, CAULE_BASE
    ]);
}

// Gerar os vértices da flor
const verticesMiolo   = mioloVertices();
const verticesPetalas = petalasVertices();
const verticesCaule   = cauleVertices();


// Contagem de vértices
const contagemMiolo   = verticesMiolo.length   / 2;   // 42
const contagemPetalas = verticesPetalas.length / 2;   // 240
const contagemCaule   = verticesCaule.length   / 2;   // 2


// --------------------------------------------------
// 2. BUFFER
// --------------------------------------------------

const bufferCaule = glFlor.createBuffer();

glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferCaule);

glFlor.bufferData(
    glFlor.ARRAY_BUFFER,
    verticesCaule,
    glFlor.STATIC_DRAW
);


const bufferPetalas = glFlor.createBuffer();

glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferPetalas);

glFlor.bufferData(
    glFlor.ARRAY_BUFFER,
    verticesPetalas,
    glFlor.STATIC_DRAW
);


const bufferMiolo = glFlor.createBuffer();

glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferMiolo);

glFlor.bufferData(
    glFlor.ARRAY_BUFFER,
    verticesMiolo,
    glFlor.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSourceFlor = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

// Cores da flor
const fragmentShaderSourceFlor = `#version 300 es

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

function createShaderFlor(gl, type, source) {

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


const vertexShaderFlor = createShaderFlor(
    glFlor,
    glFlor.VERTEX_SHADER,
    vertexShaderSourceFlor
);

const fragmentShaderFlor = createShaderFlor(
    glFlor,
    glFlor.FRAGMENT_SHADER,
    fragmentShaderSourceFlor
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const programFlor = glFlor.createProgram();

glFlor.attachShader(programFlor, vertexShaderFlor);
glFlor.attachShader(programFlor, fragmentShaderFlor);

glFlor.linkProgram(programFlor);

if (!glFlor.getProgramParameter(programFlor, glFlor.LINK_STATUS)) {

    throw new Error(
        glFlor.getProgramInfoLog(programFlor)
    );
}


// --------------------------------------------------
// 7. LOCAL DO ATRIBUTO
// --------------------------------------------------

const positionLocationFlor =
    glFlor.getAttribLocation(
        programFlor,
        "aPosition"
    );

const colorLocationFlor =
    glFlor.getUniformLocation(
        programFlor,
        "uColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTO
// --------------------------------------------------

glFlor.enableVertexAttribArray(positionLocationFlor);


// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

glFlor.clearColor(0.1, 0.4, 1.0, 1.0);

glFlor.clear(glFlor.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

glFlor.useProgram(programFlor);

// CAULE: linha verde, desenhada primeiro
glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferCaule);

glFlor.vertexAttribPointer(
    positionLocationFlor,
    2,
    glFlor.FLOAT,
    false,
    0,
    0
);

glFlor.uniform4f(colorLocationFlor, 0.1, 0.6, 0.2, 1.0);

glFlor.drawArrays(
    glFlor.LINES,
    0,
    contagemCaule
);

// PÉTALAS: elipses vermelhas
glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferPetalas);

glFlor.vertexAttribPointer(
    positionLocationFlor,
    2,
    glFlor.FLOAT,
    false,
    0,
    0
);

glFlor.uniform4f(colorLocationFlor, 0.9, 0.1, 0.15, 1.0);

glFlor.drawArrays(
    glFlor.TRIANGLES,
    0,
    contagemPetalas
);


// MIOLO: círculo amarelo, desenhado por último
glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferMiolo);

glFlor.vertexAttribPointer(
    positionLocationFlor,
    2,
    glFlor.FLOAT,
    false,
    0,
    0
);

glFlor.uniform4f(colorLocationFlor, 1.0, 0.85, 0.1, 1.0);

glFlor.drawArrays(
    glFlor.TRIANGLE_FAN,
    0,
    contagemMiolo
);