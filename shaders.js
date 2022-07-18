export const VSHADER_SOURCE = `
precision highp float;

const vec3 lightDirection = normalize(vec3(0.0, 1.0, 1.0));

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

varying vec2 vUV;
varying float vBrightness;

uniform mat4 matrix;
uniform mat4 normalMatrix;

void main() {
  vec4 worldNormal = normalMatrix * vec4(normal, 1.0);
  float diffuse = max(0.0, dot(worldNormal.xyz, lightDirection));
  vBrightness = diffuse + 0.08;
  vUV = uv;
  gl_Position = matrix * vec4(position, 1);
}
`

export const FSHADER_SOURCE = `
precision highp float;

varying vec2 vUV;
varying float vBrightness;

uniform sampler2D textureID;

void main() {
  vec4 texel = texture2D(textureID, vUV);
  gl_FragColor = vec4(texel.rgb * vBrightness, texel.a);
}
`
