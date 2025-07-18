// this code made by https://www.shadertoy.com/
precision mediump float;

uniform float iTime;
uniform vec2 iResolution;

const float cloudscale = 2.0;
const float speed = 0.02;

const vec3 skyTopColor = vec3(0.02, 0.10, 0.27);   // 上: #041a45
const vec3 skyBottomColor = vec3(0.004, 0.086, 0.271); // 下: #011545
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
  float rndOffset = fract(sin(dot(id, vec2(63.7264, 10.873))) * 92742.2347); // 時間オフセット用
  float t = globalTime + rndOffset * 10.0; // 位置ごとに時間をずらす
  float twinkle = 0.5 + 0.5 * sin(t * 5.0 + rnd * 100.0);
  float d = length(f - 0.5);

  return smoothstep(0.2, 0.0, d) * step(0.993, rnd) * twinkle;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 p = fragCoord.xy / iResolution.xy;
  vec2 uv = p * vec2(iResolution.x / iResolution.y, 1.0);

  // 背景グラデーション
  vec3 skyColor = mix(skyBottomColor, skyTopColor, p.y);

  // 雲生成（右→左へ流す）
  vec2 q = uv;
  q.x += iTime * speed;
  float cloud1 = fbm(q * cloudscale * 1.5);
  float cloud2 = fbm(q * cloudscale * 2.0);
  float cloud = cloud1 * 1.5 + cloud2;
  cloud = clamp(cloud, 0.0, 1.0);

  float cloudMask = smoothstep(0.6, 0.0, p.y); 
  cloud *= cloudMask;

  vec3 col = skyColor;
  col += cloudColor * cloud * 0.5;

  float stars = starfield(uv, iTime);
  col += starColor * stars;

  fragColor = vec4(col, 1.0);
}
