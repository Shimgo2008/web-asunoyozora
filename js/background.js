const canvas = document.getElementById('glslCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
    document.body.innerHTML = 'WebGL is not supported by your browser.';
}

const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

let program;
let positionBuffer;
let timeLocation;
let resolutionLocation;
let flagFinish;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function setupQuad(gl) {
    const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ]);
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    }
}

async function main() {
    const fragmentShaderSource = await fetch('glsl/background.glsl').then(res => res.text());

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    timeLocation = gl.getUniformLocation(program, 'u_time');
    resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    flagFinish = gl.getUniformLocation(program, 'is_finish');
    console.log(timeLocation)
    console.log(flagFinish)

    setupQuad(gl);

    gl.useProgram(program);

    window.addEventListener('resize', resize);
    resize();

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    requestAnimationFrame(render);
}

let startTime = Date.now();

function render() {
    const currentTime = (Date.now() - startTime) * 0.001;

    if (timeLocation) {
        gl.uniform1f(timeLocation, currentTime);
    }

    if (flagFinish) {
        gl.uniform1i(flagFinish, isFinish ? 1 : 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

main();
