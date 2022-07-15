import { VSHADER_SOURCE, FSHADER_SOURCE } from "./shaders.js"

const vertexData = [
  // Front
  0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
  -0.5, -0.5, 0.5,
  // Left
  -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5,
  0.5, -0.5, -0.5, -0.5,
  // Back
  -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
  -0.5, 0.5, -0.5, -0.5,
  // Right
  0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5, 0.5,
  // Top
  0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5,
  // Bottom
  0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
  -0.5, -0.5, -0.5, -0.5,
]

const repeat = (n, pattern) => {
  return [...Array(n)].reduce((sum) => sum.concat(pattern), [])
}

const uvData = repeat(
  6,
  [
    0, 0, 0, 1, 1, 0,

    1, 0, 0, 1, 1, 1,
  ]
)

const normalData = [
  ...repeat(6, [0, 0, 1]),
  ...repeat(6, [-1, 0, 0]),
  ...repeat(6, [0, 0, -1]),
  ...repeat(6, [1, 0, 0]),
  ...repeat(6, [0, 1, 0]),
  ...repeat(6, [0, -1, 0]),
]
//TEXTURE LOADER==========================================================
const loadTexture = (gl, url) => {
  const texture = gl.createTexture()
  const image = new Image()

  image.onload = (e) => {
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    gl.generateMipmap(gl.TEXTURE_2D)
  }

  image.src = url
  return texture
}
//SHADERSCREATOR============================================================
const createShader = (gl, type, str) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, str)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}
//BUFFERS CREATOR=========================================================
const createBuffer = (gl, array, attribute, program, dim) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(gl.getAttribLocation(program, attribute))
  gl.vertexAttribPointer(
    gl.getAttribLocation(program, attribute),
    dim,
    gl.FLOAT,
    false,
    0,
    0
  )
}
//SHADERS INIT=================================================================
const initShaders = (gl, program) => {
  const VS = createShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE)
  const FS = createShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE)

  gl.attachShader(program, VS)
  gl.attachShader(program, FS)

  gl.linkProgram(program)

  createBuffer(gl, vertexData, "position", program, 3)
  createBuffer(gl, uvData, "uv", program, 2)
  createBuffer(gl, normalData, "normal", program, 3)

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
}

// MAIN START FUNCTION=================================================================
const webGLStart = () => {
  const canvas = document.getElementById("canvasGL")
  if (!canvas) {
    console.log("failed")
    return
  }

  const gl = canvas.getContext("webgl", { antialias: true })
  if (!gl) console.log("Yor don't have WebGL!")

  const shaderProgram = gl.createProgram()

  initShaders(gl, shaderProgram)

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  //TEXTURES===========================================================

  const textureImg = loadTexture(gl, "./cube_texture1.png")
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, textureImg)

  //=====================================================================

  const uniformLocations = {
    matrix: gl.getUniformLocation(shaderProgram, "matrix"),
    normalMatrix: gl.getUniformLocation(shaderProgram, "normalMatrix"),
    textureID: gl.getUniformLocation(shaderProgram, "textureID"),
  }

  gl.uniform1i(uniformLocations.textureID, 0)

  const modelMatrix = mat4.create()
  const viewMatrix = mat4.create()

  const projectionMatrix = mat4.create()
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 360,
    canvas.width / canvas.height,
    0.001,
    1000
  )
  const mvMatrix = mat4.create()
  const mvpMatrix = mat4.create()
  const normalMatrix = mat4.create()

  mat4.translate(modelMatrix, modelMatrix, [0, 0.1, 0.1])
  mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2.7])
  mat4.invert(viewMatrix, viewMatrix)
  // mat4.scale(modelMatrix, modelMatrix, [0.9, 0.9, 0.9])

  const animation = () => {
    requestAnimationFrame(animation)
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / -365)
    // mat4.rotateY(modelMatrix, modelMatrix, Math.PI / -365)
    mat4.rotateZ(modelMatrix, modelMatrix, Math.PI / -365)

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix)
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix)

    mat4.invert(normalMatrix, mvMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix)
    gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix)

    // gl.clearColor(0.2, 0.4, 0.55, 1)
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3)
  }

  animation()
}

webGLStart()
