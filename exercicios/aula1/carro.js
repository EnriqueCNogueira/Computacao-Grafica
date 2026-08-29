// --------------------------------------------------
// 0. INICIALIZAÇÃO
// --------------------------------------------------

const canvasCarro = document.getElementById("carro");
const glCarro = canvasCarro.getContext("webgl2");

if (!glCarro) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// 1. VÉRTICES
// --------------------------------------------------

// Constantes do chassi (parte de baixo, mais larga)
const CHASSI_LARG = 0.75;    // semi-largura do chassi
const CHASSI_ALT  = 0.26;    // semi-altura do chassi
const CHASSI_Y    = -0.03;   // altura do centro do chassi

// Constantes da cabine (parte de cima, mais estreita)
const CABINE_LARG = 0.54;    // semi-largura da cabine
const CABINE_ALT  = 0.11;    // semi-altura da cabine
const CABINE_DESL = 0.02;    // deslocamento horizontal da cabine

// Constantes das rodas
const RODA_X     = 0.36;     // distância horizontal do centro até cada roda
const RODA_RAIO  = 0.14;     // raio da roda
const RODA_LADOS = 32;       // resolução do círculo da roda

// Função que devolve dois triângulos (6 vértices) formando um retângulo
function retanguloCarro(cx, cy, sx, sy) {

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

// Função para gerar o chassi
function chassiVertices() {

    return new Float32Array(
        retanguloCarro(0.0, CHASSI_Y, CHASSI_LARG, CHASSI_ALT)
    );
}

// Função para gerar a cabine, apoiada exatamente no topo do chassi
function cabineVertices() {

    const baseY   = CHASSI_Y + CHASSI_ALT;
    const centroY = baseY + CABINE_ALT;

    return new Float32Array(
        retanguloCarro(CABINE_DESL, centroY, CABINE_LARG, CABINE_ALT)
    );
}

// Função para gerar as duas rodas como fatias de triângulo
function rodasVertices() {

    const centroY = CHASSI_Y - CHASSI_ALT;

    const v = [];

    for (const cx of [-RODA_X, RODA_X]) {

        for (let i = 0; i < RODA_LADOS; i++) {

            const a1 = i * 2 * Math.PI / RODA_LADOS;
            const a2 = (i + 1) * 2 * Math.PI / RODA_LADOS;

            v.push(
                cx, centroY,

                cx + RODA_RAIO * Math.cos(a1),
                centroY + RODA_RAIO * Math.sin(a1),

                cx + RODA_RAIO * Math.cos(a2),
                centroY + RODA_RAIO * Math.sin(a2)
            );
        }
    }

    return new Float32Array(v);
}


// Gerar os vértices do carro
const verticesRodas  = rodasVertices();
const verticesChassi = chassiVertices();
const verticesCabine = cabineVertices();


// Contagem de vértices
const contagemRodas  = verticesRodas.length  / 2;   // 192
const contagemChassi = verticesChassi.length / 2;   // 6
const contagemCabine = verticesCabine.length / 2;   // 6


// --------------------------------------------------
// 2. BUFFER
// --------------------------------------------------

const bufferRodas = glCarro.createBuffer();

glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferRodas);

glCarro.bufferData(
    glCarro.ARRAY_BUFFER,
    verticesRodas,
    glCarro.STATIC_DRAW
);


const bufferChassi = glCarro.createBuffer();

glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferChassi);

glCarro.bufferData(
    glCarro.ARRAY_BUFFER,
    verticesChassi,
    glCarro.STATIC_DRAW
);


const bufferCabine = glCarro.createBuffer();

glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferCabine);

glCarro.bufferData(
    glCarro.ARRAY_BUFFER,
    verticesCabine,
    glCarro.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSourceCarro = `#version 300 es

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

// A cor de cada parte do carro entra por uniform
const fragmentShaderSourceCarro = `#version 300 es

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

function createShaderCarro(gl, type, source) {

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


const vertexShaderCarro = createShaderCarro(
    glCarro,
    glCarro.VERTEX_SHADER,
    vertexShaderSourceCarro
);

const fragmentShaderCarro = createShaderCarro(
    glCarro,
    glCarro.FRAGMENT_SHADER,
    fragmentShaderSourceCarro
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const programCarro = glCarro.createProgram();

glCarro.attachShader(programCarro, vertexShaderCarro);
glCarro.attachShader(programCarro, fragmentShaderCarro);

glCarro.linkProgram(programCarro);

if (!glCarro.getProgramParameter(programCarro, glCarro.LINK_STATUS)) {

    throw new Error(
        glCarro.getProgramInfoLog(programCarro)
    );
}


// --------------------------------------------------
// 7. LOCAL DO ATRIBUTO
// --------------------------------------------------

const positionLocationCarro =
    glCarro.getAttribLocation(
        programCarro,
        "aPosition"
    );

const colorLocationCarro =
    glCarro.getUniformLocation(
        programCarro,
        "uColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTO
// --------------------------------------------------

glCarro.enableVertexAttribArray(positionLocationCarro);


// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

glCarro.clearColor(0.1, 0.4, 1.0, 1.0);

glCarro.clear(glCarro.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

glCarro.useProgram(programCarro);

// CHASSI: retângulo vermelho largo
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferChassi);

glCarro.vertexAttribPointer(
    positionLocationCarro,
    2,
    glCarro.FLOAT,
    false,
    0,
    0
);

glCarro.uniform4f(colorLocationCarro, 0.93, 0.11, 0.14, 1.0);

glCarro.drawArrays(
    glCarro.TRIANGLES,
    0,
    contagemChassi
);


// CABINE: retângulo vermelho estreito
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferCabine);

glCarro.vertexAttribPointer(
    positionLocationCarro,
    2,
    glCarro.FLOAT,
    false,
    0,
    0
);

glCarro.uniform4f(colorLocationCarro, 0.93, 0.11, 0.14, 1.0);

glCarro.drawArrays(
    glCarro.TRIANGLES,
    0,
    contagemCabine
);


// RODAS: círculos pretos
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferRodas);

glCarro.vertexAttribPointer(
    positionLocationCarro,
    2,
    glCarro.FLOAT,
    false,
    0,
    0
);

glCarro.uniform4f(colorLocationCarro, 0.0, 0.0, 0.0, 1.0);

glCarro.drawArrays(
    glCarro.TRIANGLES,
    0,
    contagemRodas
);