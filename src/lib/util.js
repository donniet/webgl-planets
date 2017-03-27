export function createShader(gl, str, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}
export function createProgram(gl, vertex_shader, fragment_shader) {
  var program = gl.createProgram();
  var vshader = createShader(gl, vertex_shader, gl.VERTEX_SHADER);
  var fshader = createShader(gl, fragment_shader, gl.FRAGMENT_SHADER);
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}
export function initTexturesAsync(gl, urls, nonPowerOfTwo) {
  function handleTextureLoad(gl, img, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (!nonPowerOfTwo) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      // Prevents s-coordinate wrapping (repeating).
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      // Prevents t-coordinate wrapping (repeating).
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  var createTextureAsync = url => {
    return new Promise((resolve, reject) => {
      var tex = gl.createTexture();

      var img;
      if (url instanceof Image || url instanceof HTMLImageElement) {
        handleTextureLoad(gl, url, tex);
        resolve(tex);
        return;
      } else if (url instanceof HTMLCanvasElement) {
        handleTextureLoad(gl, url, tex);
        resolve(tex);
        return;
      } else {
        img = new Image();
        img.onload = () => {
          handleTextureLoad(gl, img, tex);
          resolve(tex);
        };
        img.src = url;
      }
    });
  }

  if (typeof urls.map == 'function') {
    return Promise.all(urls.map(createTextureAsync));
  } else {
    return createTextureAsync(urls);
  }
}
