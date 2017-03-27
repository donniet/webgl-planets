import { mat4 } from "gl-matrix";
import io from "socket.io";
import createSphereAsync from "sphere";

function main(fieldOfView, env) {
  if (env == "DEVELOPMENT") {
    var socket = io();
    socket.on('reconnect', () => {
      window.location.reload();
    });
  }

  var width, height;
  var near = 1., far = 10.;
  var projection = mat4.create();
  var lesson;

  var el = document.createElement('canvas');
  document.body.appendChild(el);
  var gl = el.getContext("webgl") || el.getContext("expirimental-webgl");
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  window.gl = gl;

  function resize() {
    if (width == document.documentElement.clientWidth && height == document.documentElement.clientHeight)
      return;

    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
    var aspect = width / height;

    el.width = width; el.height = height;
    gl.viewport(0, 0, width, height);
    mat4.perspective(projection, fieldOfView, aspect, near, far);

    console.log('projection', projection);
  }

  var lastOffsetX = 0;
  var lastOffsetY = 0;
  var offsetY = 0;
  var offsetX = 0;
  var lastY, lastX;

  function handleMove(e) {
    if (lastX)
      offsetX = lastOffsetX + (e.clientX - lastX);
    if (lastY)
      offsetY = lastOffsetY + (e.clientY - lastY);
  }
  function handleStart(e) {
    lastY = e.clientY;
    lastX = e.clientX;
    lastOffsetY = offsetY;
    lastOffsetX = offsetX;
  }
  function handleEnd() {
    lastY = null;
    lastX = null;
    lastOffsetX = null;
    lastOffsetY = null;
  }

  function play(lesson) {
    requestAnimationFrame(() => play(lesson));
    resize();

    var t = new Date().getTime();
    if (lastX) t = 0;
    // t = 0;

    var m = mat4.create();
    // mat4.fromRotation(m, t / 1000., [1,1,0.5]);

    var view = mat4.create();
    mat4.fromTranslation(view, [0,0,-2]);
    mat4.rotateX(view, view, offsetY / 100);
    mat4.rotateY(view, view, t / 1200 + offsetX / 100);

    lesson.render(gl, m, view, projection);
  }

  window.addEventListener('mousedown', e => {
    handleStart(e);
    window.addEventListener('mousemove', handleMove, false);
  }, false);
  window.addEventListener('mouseup', e => {
    window.removeEventListener('mosemove', handleMove);
    handleEnd(e);
  }, false);


  createSphereAsync(gl).then(sphere => {
    if (!sphere) {
      console.log('unknown lesson');
      return;
    }

    play(sphere);
  });
}

main(60. * Math.PI / 180., document.body.dataset.environment);
