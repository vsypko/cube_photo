export const VSHADER_SOURCE = `
precision mediump float;
attribute vec3 position;
attribute vec2 uv;

varying vec2 vUV;

uniform mat4 matrix;

void main() {
  vUV = uv;
  gl_Position = matrix * vec4(position, 1);
}
`

export const FSHADER_SOURCE = `
precision mediump float;
varying vec2 vUV;

uniform sampler2D textureID;

void main() {
  gl_FragColor = texture2D(textureID, vUV);
}
`
