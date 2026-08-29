const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


const canvasCoordinates =
    document.getElementById(
        "canvasCoordinates"
    );

const webglCoordinates =
    document.getElementById(
        "webglCoordinates"
    );

const mode =
    document.getElementById(
        "mode"
    );


// --------------------------------------------------
// 1a. VERTICES
// --------------------------------------------------

let vertices = new Float32Array([]);


// --------------------------------------------------
// 1b. CORES
// --------------------------------------------------

let colors = new Float32Array([]);

// Cor das figuras: azul
const cor = [0.0, 0.0, 1.0];


// --------------------------------------------------
// 1c. MODO E CLIQUES
// --------------------------------------------------

// "reta" (2 cliques) ou "triangulo" (3 cliques)
let modo = "reta";

let cliques = [];


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);

const colorsBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    colors,
    gl.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 1.0;
    vColor = aColor;
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
}

`;


// --------------------------------------------------
// 5. COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getAttribLocation(
        program,
        "aColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.enableVertexAttribArray(colorLocation);

gl.vertexAttribPointer(
    colorLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
);


// --------------------------------------------------
// 9. ALGORITMO DE BRESENHAM
// --------------------------------------------------

// Recebe dois pontos em coordenadas de tela (inteiras)
// e devolve os pixels da reta em [x, y, x, y, ...].
//
// A cada passo andamos 1 pixel no eixo dominante e
// acumulamos o erro. Quando o erro ultrapassa o limite,
// andamos também 1 pixel no outro eixo. Só aritmética
// inteira: sem float, sem divisão.

function bresenham(x0, y0, x1, y1) {

    const pixels = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    // Sentido do caminhamento em cada eixo
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    let erro = dx - dy;

    while (true) {

        pixels.push(x0, y0);

        if (x0 === x1 && y0 === y1) {
            break;
        }

        const erro2 = 2 * erro;

        if (erro2 > -dy) {
            erro -= dy;
            x0 += sx;
        }

        if (erro2 < dx) {
            erro += dx;
            y0 += sy;
        }
    }

    return pixels;
}


// --------------------------------------------------
// 10. ENVIAR OS PIXELS PARA A GPU
// --------------------------------------------------

// Converte a lista de pixels para o intervalo [-1, 1],
// gera uma cor por vértice e atualiza os dois buffers.
// O + 0.5 coloca o vértice no centro do pixel.

function atualizarBuffers(pixels) {

    const posicoes = [];
    const cores = [];

    for (let i = 0; i < pixels.length; i += 2) {

        posicoes.push(
            ((pixels[i] + 0.5) / canvas.width) * 2 - 1,
            -(((pixels[i + 1] + 0.5) / canvas.height) * 2 - 1)
        );

        cores.push(cor[0], cor[1], cor[2]);
    }

    vertices = new Float32Array(posicoes);
    colors = new Float32Array(cores);

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        vertices,
        gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        colors,
        gl.STATIC_DRAW
    );

    drawScene();
}


// --------------------------------------------------
// 11. TRAÇAR UMA RETA
// --------------------------------------------------

function tracarLinha(x0, y0, x1, y1) {

    atualizarBuffers(
        bresenham(x0, y0, x1, y1)
    );
}


// --------------------------------------------------
// 12. TRAÇAR UM TRIÂNGULO
// --------------------------------------------------

// Apenas o contorno: as arestas A-B, B-C e C-A. Cada
// aresta é uma chamada do mesmo Bresenham da reta.

function tracarTriangulo(a, b, c) {

    atualizarBuffers([
        ...bresenham(a.x, a.y, b.x, b.y),
        ...bresenham(b.x, b.y, c.x, c.y),
        ...bresenham(c.x, c.y, a.x, a.y)
    ]);
}


// --------------------------------------------------
// 13. INTERAÇÃO COM O MOUSE
// --------------------------------------------------

canvas.addEventListener("mousedown", mouseClick, false);

function mouseClick(event) {

    // Posição do clique em pixels
    const x = Math.floor(event.offsetX);
    const y = Math.floor(event.offsetY);

    canvasCoordinates.textContent =
        `Canvas: (${x}, ${y})`;

    // Converter para o intervalo [-1, 1]. O sinal do Y
    // é invertido porque o eixo Y do canvas cresce para
    // baixo e o do WebGL cresce para cima
    const webglX = (x / canvas.width) * 2 - 1;
    const webglY = -((y / canvas.height) * 2 - 1);

    webglCoordinates.textContent =
        `WebGL: (${webglX.toFixed(3)}, ${webglY.toFixed(3)})`;

    cliques.push({ x: x, y: y });

    // A reta fecha em 2 cliques, o triângulo em 3
    const necessarios = (modo === "reta") ? 2 : 3;

    if (cliques.length === 1) {

        // Primeiro clique de uma figura nova:
        // a figura anterior é apagada da tela
        atualizarBuffers([]);

    } else if (cliques.length === necessarios) {

        if (modo === "reta") {

            tracarLinha(
                cliques[0].x, cliques[0].y,
                cliques[1].x, cliques[1].y
            );

        } else {

            tracarTriangulo(
                cliques[0],
                cliques[1],
                cliques[2]
            );
        }

        cliques = [];
    }
}


// --------------------------------------------------
// 14. INTERAÇÃO COM O TECLADO
// --------------------------------------------------

document.addEventListener("keydown", keyboardClick, false);

function keyboardClick(event) {

    switch (event.key) {

        case "r":
        case "R":
            modo = "reta";
            mode.textContent = "RETA";
            break;

        case "t":
        case "T":
            modo = "triangulo";
            mode.textContent = "TRIÂNGULO";
            break;

        default:
            return;
    }

    // Trocar de modo limpa a tela e os cliques pendentes
    cliques = [];

    atualizarBuffers([]);
}


// --------------------------------------------------
// 15. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 16. DESENHAR
// --------------------------------------------------

const numComponents = 2;

gl.useProgram(program);

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.drawArrays(
        gl.POINTS,
        0,
        vertices.length / numComponents
    );
}

// Reta azul de (0, 0) a (0, 0): o centro do canvas
tracarLinha(300, 300, 300, 300);
