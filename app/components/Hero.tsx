"use client";

import { useEffect, useRef, forwardRef } from "react";
import Link from "next/link";

// ── Vertex shader ──────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ── Fragment shader (same as ShaderPill, no hold interaction) ──
const FRAG = `
precision mediump float;

uniform float uTime;
uniform float uAmplitude;
uniform float uReveal;
varying vec2  vUv;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = vUv;
  vec2 centeredUv = 2.0 * uv - 1.0;
  float distortionStrength = uAmplitude * uReveal;

  centeredUv += distortionStrength * 0.4 * sin(1.0  * centeredUv.yx + vec2(1.2, 3.4) + uTime);
  centeredUv += distortionStrength * 0.2 * sin(5.2  * centeredUv.yx + vec2(3.5, 0.4) + uTime);
  centeredUv += distortionStrength * 0.3 * sin(3.5  * centeredUv.yx + vec2(1.2, 3.1) + uTime);
  centeredUv += distortionStrength * 1.6 * sin(0.4  * centeredUv.yx + vec2(0.8, 2.4) + uTime);

  vec3 c0 = vec3(0.000, 0.000, 0.000);
  vec3 c1 = vec3(0.937, 0.949, 0.753);
  vec3 c2 = vec3(0.624, 0.918, 0.976);
  vec3 c3 = vec3(0.463, 0.608, 0.635);

  vec3 uColors[4];
  uColors[0] = c0;
  uColors[1] = c1;
  uColors[2] = c2;
  uColors[3] = c3;

  vec3 color = uColors[0];
  for (int i = 0; i < 4; i++) {
    float r = cos(float(i) * length(centeredUv));
    color = mix(color, uColors[i], r);
  }



  float vignette = 1.0 - dot(centeredUv * 0.55, centeredUv * 0.55);
  vignette = pow(clamp(vignette, 0.0, 1.0), 1.4);
  color *= mix(0.55, 1.0, vignette);

  gl_FragColor = vec4(mix(vec3(0.0), color, uReveal), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, src: string, type: number) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error("Shader error:", gl.getShaderInfoLog(s));
  return s;
}

function buildProgram(gl: WebGLRenderingContext) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, VERT, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(gl, FRAG, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    console.error("Program error:", gl.getProgramInfoLog(prog));
  return prog;
}

// ── Full-bleed canvas (no pill shape, no hover label) ──────
const HeroShader = forwardRef<HTMLCanvasElement>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // merge forwarded ref with local ref
  useEffect(() => {
    if (typeof ref === "function") ref(canvasRef.current);
    else if (ref) ref.current = canvasRef.current;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const prog = buildProgram(gl);
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uAmplitude = gl.getUniformLocation(prog, "uAmplitude");
    const uReveal = gl.getUniformLocation(prog, "uReveal");
    const aPos = gl.getAttribLocation(prog, "a_pos");

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(prog);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const cfg = {
      amplitude: 0.65,
      timeSpeed: 0.008,
      lerpSpeed: 0.03,
      revealDuration: 2000,
      revealDelay: 300,
    };

    let reveal = 0;
    let revealStart = 0;
    let revealStarted = false;
    let time = 0;

    setTimeout(() => {
      revealStarted = true;
      revealStart = performance.now() + cfg.revealDelay;
    }, 0);

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function frame() {
      if (revealStarted) {
        const elapsed = Math.max(0, performance.now() - revealStart);
        reveal = Math.min(1, easeOut(elapsed / cfg.revealDuration));
      }

      time += cfg.timeSpeed;

      gl!.uniform1f(uTime, time);
      gl!.uniform1f(uAmplitude, cfg.amplitude);
      gl!.uniform1f(uReveal, reveal);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
});

HeroShader.displayName = "HeroShader";

// ── Hero ───────────────────────────────────────────────────
export default function Hero() {
  return (
    <section className="relative flex  w-full flex-col items-center justify-center px-6 py-16 text-center sm:px-8">
   {/**  <HeroShader /> */} 

    </section>
  );
}
