varying vec2 vUv;

uniform float u_aspect;
uniform float u_time;
uniform bool u_isFull;
uniform float u_radius;
uniform float u_step;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_bassIntensity;
uniform float u_highIntensity;
uniform float u_activeProgress;
uniform float u_timeAcceleration;
uniform float u_radiusAcceleration;
uniform float u_radiusDistortion;

float fbm(vec3 x, int NUM_OCTAVES) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * snoise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

vec2 getAspectCoords(vec2 coords) {
  coords.x *= u_aspect;

  return coords;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
}

void main() {
  vec2 st = getAspectCoords(vUv);
  st -= getAspectCoords(vec2(0.5));
  st = rotate2d(u_time * 2.0) * st;
  st += getAspectCoords(vec2(0.5));

  vec2 uv = st;

  float saturation = 0.5 + (u_bassIntensity * 0.5);
  vec3 gradColor1 = mix(vec3(1.0), u_color1, u_activeProgress * saturation);
  vec3 gradColor2 = mix(vec3(1.0), u_color2, u_activeProgress * saturation);

  float time = u_time + (u_time * 0.5) * (u_bassIntensity + u_highIntensity) * u_timeAcceleration;

  float mainRadius = u_radius + u_bassIntensity * u_radius * u_radiusAcceleration;
  float alphaRadius = mainRadius * (1.1 + 0.1 * u_bassIntensity);
  float innerRadius = mainRadius * 0.75;

  vec2 center = getAspectCoords(vec2(0.5, 0.5));

  float mainCircleUvNoise = snoise(vec3(uv * 2.0, time));
  vec2 mainCircleUv = uv + mainCircleUvNoise * (u_highIntensity * u_radiusDistortion);
  float mainCircle = distance(mainCircleUv, center);

  float distorionCircle = smoothstep(mainRadius * u_step, mainRadius, mainCircle);
  float alphaCircle = 1.0 - smoothstep(alphaRadius * u_step, alphaRadius, mainCircle);
  float innerCircle = smoothstep(innerRadius * u_step, innerRadius, mainCircle);
  
  float simplexCoordsNoise = snoise(vec3(uv + distorionCircle, time * 0.75));
  vec2 simplexCoords = uv + simplexCoordsNoise * (1.0 - vUv.y * u_activeProgress);
  float simplexColor = fbm(vec3(simplexCoords * 2.0, time), 2);
  simplexColor *= 2.0 + (2.0 * u_activeProgress);

  vec3 gradient = mix(gradColor1, gradColor2, vUv.y);

  if (u_isFull) {
    alphaCircle = 1.0;
  }

  vec3 color = vec3(simplexColor * alphaCircle * innerCircle) * gradient;

  gl_FragColor = vec4(color, 1.0);
}
