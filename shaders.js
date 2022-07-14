export const VSHADER_SOURCE = `
precision mediump float;

const vec3 lightDirection = normalize(vec3(0.0, 1.0, 1.0));

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

varying vec2 vUV;
varying float vBrightness;

uniform mat4 matrix;
uniform mat4 normalMatrix;

void main() {
  vec3 worldNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
  float diffuse = max(0.0, dot(worldNormal, lightDirection));
  vBrightness = diffuse + 0.15;
  vUV = uv;
  gl_Position = matrix * vec4(position, 1);
}
`

export const FSHADER_SOURCE = `
precision mediump float;

varying vec2 vUV;
varying float vBrightness;

uniform sampler2D textureID;

void main() {
  vec4 texel = texture2D(textureID, vUV);
  texel.xyz *= vBrightness;
  gl_FragColor = texel;
}
`
