import { mat4, vec4 } from "gl-matrix";
import { initTexturesAsync, createProgram } from "util";

var corners = [
  -1, -1,
  1, -1,
  1, 1,
  -1, 1
];

var vertex = `
precision mediump float;

attribute vec2 corner;

uniform mat4 inv;

varying vec3 direction;

void main() {
  gl_Position = vec4(corner, 1.0, 1.0);
  direction = (inv * gl_Position).xyz;
}
`;


var fragment = `
precision mediump float;

uniform vec3 camera;
uniform sampler2D texture;
uniform vec3 sun;

varying vec3 direction;

vec4 textureSphere(sampler2D texture, vec3 p) {
  vec2 s = vec2(atan(p.x, p.z), -asin(p.y));
  /* [ \frac{1}{2\pi}, \frac{1}{\pi} ] */
  s *= vec2(0.1591549430919, 0.31830988618379);

  return texture2D(texture, vec2(s.s + 0.5, s.t + 0.5));
}

void swap(inout float a, inout float b) {
  float c = a;
  a = b;
  b = c;
}

bool solveQuadratic(float a, float b, float c, out float x0, out float x1) {
  float discr = b * b - 4. * a * c;
  if (discr < 0.) return false;

  if (discr == 0.) {
    x0 = x1 = -0.5 * b / a;
  } else {
    float q;
    if (b > 0.) {
      q = -0.5 * (b + sqrt(discr));
    } else {
      q = -0.5 * (b - sqrt(discr));
    }
    x0 = q / a;
    x1 = c / q;

    if (x0 > x1) swap(x0, x1);
  }

  return true;
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection
bool rayIntersectsSphere(vec3 orig, vec3 dir, vec3 center, float radius, out vec3 inter, out vec3 n) {
  float r2 = radius * radius;

  vec3 L = orig - center;
  float a = dot(dir, dir);
  float b = 2. * dot(dir, L);
  float c = dot(L, L) - r2;

  float t0, t1;
  if (!solveQuadratic(a, b, c, t0, t1)) {
    return false;
  }

  if (t0 < 0.) {
    t0 = t1;
    if (t0 < 0.) return false;
  }

  inter = orig + t0 * dir;
  n = normalize(inter - center);

  return true;
}

void main() {
  vec3 inter = vec3(0.,0.,0.);
  vec3 n = vec3(0., 0., 0.);
  vec3 center = vec3(0., 0., 0.);
  if (rayIntersectsSphere(camera, direction, center, 1., inter, n)) {
    float shade = max(dot(sun, n), 0.) + 0.05;
    vec4 col = textureSphere(texture, n);
    gl_FragColor = vec4(shade * col.xyz, col.w);
  } else {
    gl_FragColor = vec4(0.,0.,0.,1.);
  }

}
`;


class Sphere {
  constructor(gl, obj = {}) {
    this.texture = obj.texture;
    this.program = createProgram(gl, vertex, fragment);

    this.locations = {
      corner: gl.getAttribLocation(this.program, 'corner'),
      inv: gl.getUniformLocation(this.program, 'inv'),
      camera: gl.getUniformLocation(this.program, 'camera'),
      texture: gl.getUniformLocation(this.program, 'texture'),
      sun: gl.getUniformLocation(this.program, 'sun'),
    };

    this.buffers = {};
    this.buffers.corners = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.corners);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);

  }
  render(gl, model, view, projection) {
    var t = new Date().getTime();

    if (!model) model = mat4.create();
    if (!view) view = mat4.create();
    if (!projection) projection = mat4.create();
    var mv = mat4.create();
    mat4.multiply(mv, view, model);
    mat4.multiply(mv, projection, mv);
    mat4.invert(mv, mv);

    var camera = vec4.clone([0,0,0,1]);
    var iv = mat4.create();
    mat4.invert(iv, view);
    vec4.transformMat4(camera, camera, iv);

    if (!this.output) {
      this.output = true;
      console.log('camera', camera);
    }

    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.locations.corner);

    gl.uniformMatrix4fv(this.locations.inv, false, mv);
    gl.uniform3fv(this.locations.camera, camera.slice(0,3));
    gl.uniform3fv(this.locations.sun, new Float32Array([Math.cos(t / 6000.), 0., -Math.sin(t / 6000.)]));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locations.texture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.corners);
    gl.vertexAttribPointer(this.locations.corner, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.disableVertexAttribArray(this.locations.corner);
  }
}

export default function createSphereAsync(gl) {
  return Promise.all([
    initTexturesAsync(gl, 'img/iomoon.jpg', true)
  ]).then(([moon]) => new Sphere(gl, {texture: moon}));
}
