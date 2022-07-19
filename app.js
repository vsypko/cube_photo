import { VSHADER_SOURCE, FSHADER_SOURCE } from "./shaders.js"

let loaded = false
let animationActive = true
let prevX, prevY, dx, dy

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

const setContent = (url, type) => {
  if (type === "video") {
    let playing = false

    const video = document.createElement("video")

    video.autoplay = true
    video.muted = true
    video.loop = true

    function checkReady() {
      if (playing) {
        loaded = true
      }
    }

    video.addEventListener(
      "playing",
      function () {
        playing = true
        checkReady()
      },
      true
    )

    video.src = url
    video.play()
    return video
  }
  const image = new Image()

  image.onload = (e) => {
    loaded = true
  }

  image.src = url
  return image
}

const initTexture = (gl) => {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const pixel = new Uint8Array([50, 150, 230, 255])

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixel
  )

  // gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

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
  gl.useProgram(program)
}

const drawScene = (
  gl,
  modelMatrix,
  mvMatrix,
  mvpMatrix,
  viewMatrix,
  projectionMatrix,
  normalMatrix,
  uniformLocations,
  texture
) => {
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  if (!animationActive) {
    mat4.rotateX(modelMatrix, modelMatrix, Math.atan(-dy))
    mat4.rotateY(modelMatrix, modelMatrix, Math.atan(dx))
    dx = 0
    dy = 0
  } else {
    mat4.rotate(modelMatrix, modelMatrix, Math.PI / -500, [1, 0, 1])
  }

  mat4.multiply(mvMatrix, viewMatrix, modelMatrix)
  mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix)

  mat4.invert(normalMatrix, mvMatrix)
  mat4.transpose(normalMatrix, normalMatrix)

  gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix)
  gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix)

  gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3)
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
  //===============================================================
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.enable(gl.DEPTH_TEST)

  //===================================================================

  const shaderProgram = gl.createProgram()
  initShaders(gl, shaderProgram)

  //===================================================================

  createBuffer(gl, vertexData, "position", shaderProgram, 3)
  createBuffer(gl, uvData, "uv", shaderProgram, 2)
  createBuffer(gl, normalData, "normal", shaderProgram, 3)

  //TEXTURES===========================================================

  const content = setContent("fishing.mp4", "video")
  // const content = setContent("Sanya.jpg", "image")
  const texture = initTexture(gl)
  // const textureImg = setImgTexture(gl, "Sanya.jpeg", texture)

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

  canvas.onpointerdown = (e) => {
    e.preventDefault()
    if (e.isPrimary) {
      animationActive = false
      prevX = (e.clientX * 2) / gl.canvas.width - 1
      prevY = 1 - (e.clientY * 2) / gl.canvas.height
      dx = 0
      dy = 0
    }
  }
  canvas.onpointerup = (e) => {
    e.preventDefault()
    if (e.isPrimary) {
      animationActive = true
    }
  }
  canvas.onpointerout = (e) => {
    e.preventDefault()
    if (e.isPrimary) {
      animationActive = true
    }
  }
  canvas.onpointermove = (e) => {
    e.preventDefault()
    if (!animationActive) {
      dx = (e.clientX * 2) / gl.canvas.width - 1 - prevX
      dy = 1 - (2 * e.clientY) / gl.canvas.height - prevY
      prevX += dx
      prevY += dy
    }
  }

  const render = () => {
    if (loaded) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        content
      )
    }

    drawScene(
      gl,
      modelMatrix,
      mvMatrix,
      mvpMatrix,
      viewMatrix,
      projectionMatrix,
      normalMatrix,
      uniformLocations,
      texture
    )

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

window.onload = webGLStart
