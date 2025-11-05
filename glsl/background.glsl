precision mediump float;

uniform float u_time; // time
uniform vec2 u_resolution; // resolution
uniform bool is_finish;



const float cloudscale = 2.0;
const float speed = 0.02;

const vec3 skyTopColor = vec3(0.02, 0.10, 0.27);     // 上: #041a45
vec3 skyBottomColor = vec3(0.004, 0.086, 0.271); // 下: #011545
const vec3 starColor = vec3(1.0, 1.0, 1.0);
const vec3 cloudColor = vec3(0.6, 0.6, 0.7); // 薄灰色
const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i+0.0)), dot(b, hash(i+o)), dot(c, hash(i+1.0)));
    return dot(n, vec3(70.0));
}

float fbm(vec2 n) {
    float total = 0.0, amplitude = 0.6;
    for (int i = 0; i < 10; i++) {
        total += noise(n) * amplitude;
        n = m * n;
        amplitude *= 0.5;
    }
    return total;
}

float starfield(vec2 uv, float globalTime) {
    uv *= 100.0;
    vec2 id = floor(uv);
    vec2 f = fract(uv);

    float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float rndOffset = fract(sin(dot(id, vec2(63.7264, 10.873))) * 92742.2347);
    float t = globalTime + rndOffset * 10.0;
    float twinkle = 0.5 + 0.5 * sin(t * 5.0 + rnd * 100.0);
    float d = length(f - 0.5);

    return smoothstep(0.2, 0.0, d) * step(0.993, rnd) * twinkle;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = fragCoord.xy / u_resolution.xy;
    vec2 uv = p * vec2(u_resolution.x / u_resolution.y, 1.0);

    vec3 localSkyBottomColor = is_finish
        ? vec3(0.9451, 0.5686, 0.3804)
        : vec3(0.004, 0.086, 0.271);

    float mix_rate = is_finish
        ? 1.0
        : 2.0;

    vec3 skyColor = mix(localSkyBottomColor, skyTopColor, p.y * mix_rate);

    vec2 q = uv;
    q.x += u_time * speed;
    float cloud = 0.0;
    for (int i = 0; i < 1; i++) {
        float a = 0.7 + float(i) * 0.3;
        float weight = 1.0 / (float(i) + 1.0);
        cloud += fbm(q * cloudscale * a) * weight;
    }
    cloud = clamp(cloud * 2.0, 0.0, 1.0);
    float cloudMask = smoothstep(0.7, 0.0, p.y); 
    cloud *= cloudMask;

    vec3 col = skyColor;
    col += cloudColor * cloud * 0.5;

    float stars = starfield(uv, u_time);
    col += starColor * stars;

    gl_FragColor = vec4(col, 1.0);
}
