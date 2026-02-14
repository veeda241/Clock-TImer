/**
 * Grainient - Vanilla JS WebGL Implementation
 * Mimics the React Grainient component
 */
class Grainient {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id ${canvasId} not found`);
            return;
        }

        // Default options based on user request
        this.options = {
            color1: options.color1 || "#9eb1ff",
            color2: options.color2 || "#a929ff",
            color3: options.color3 || "#B19EEF",
            timeSpeed: options.timeSpeed || 0.25,
            warpStrength: options.warpStrength || 1.0,
            warpFrequency: options.warpFrequency || 5.0,
            warpSpeed: options.warpSpeed || 2.0,
            grainAmount: options.grainAmount || 0.1,
            grainScale: options.grainScale || 2.0,
            // ... other options mapped as needed
        };

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error("WebGL not supported");
            return;
        }

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0, 0, 0];
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    init() {
        // Vertex Shader
        const vsSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment Shader
        const fsSource = `
            precision highp float;
            
            uniform vec2 uResolution;
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform float uWarpStrength;
            uniform float uWarpFrequency;
            uniform float uWarpSpeed;
            uniform float uGrainAmount;
            uniform float uGrainScale;

            // Random function for grain
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            // Smooth noise
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution.xy;
                
                // Aspect ratio correction
                float aspect = uResolution.x / uResolution.y;
                vec2 st = uv;
                st.x *= aspect; 

                // Warp Logic
                float t = uTime * uWarpSpeed * 0.1;
                float warp = noise(st * uWarpFrequency + t);
                
                // Distort UVs
                vec2 distortedUV = uv + vec2(warp * uWarpStrength * 0.1);

                // Gradient Mixing
                // Mix color1 and color2 horizontally
                vec3 colA = mix(uColor1, uColor2, distortedUV.x + 0.2 * sin(t));
                // Mix result with color3 vertically
                vec3 color = mix(colA, uColor3, distortedUV.y + 0.2 * cos(t));

                // Add Grain
                float grain = (random(gl_FragCoord.xy * uGrainScale + mod(uTime, 10.0)) - 0.5) * uGrainAmount;
                color += grain;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        // Fullscreen quad
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]), this.gl.STATIC_DRAW);

        this.positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Uniform locations
        this.uResolution = this.gl.getUniformLocation(this.program, "uResolution");
        this.uTime = this.gl.getUniformLocation(this.program, "uTime");
        this.uColor1 = this.gl.getUniformLocation(this.program, "uColor1");
        this.uColor2 = this.gl.getUniformLocation(this.program, "uColor2");
        this.uColor3 = this.gl.getUniformLocation(this.program, "uColor3");
        this.uWarpStrength = this.gl.getUniformLocation(this.program, "uWarpStrength");
        this.uWarpFrequency = this.gl.getUniformLocation(this.program, "uWarpFrequency");
        this.uWarpSpeed = this.gl.getUniformLocation(this.program, "uWarpSpeed");
        this.uGrainAmount = this.gl.getUniformLocation(this.program, "uGrainAmount");
        this.uGrainScale = this.gl.getUniformLocation(this.program, "uGrainScale");
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    animate(now) {
        if (!this.program) return;

        this.gl.useProgram(this.program);

        // Update Uniforms
        this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uTime, (now || 0) * 0.001 * this.options.timeSpeed);

        const c1 = this.hexToRgb(this.options.color1);
        const c2 = this.hexToRgb(this.options.color2);
        const c3 = this.hexToRgb(this.options.color3);

        this.gl.uniform3fv(this.uColor1, c1);
        this.gl.uniform3fv(this.uColor2, c2);
        this.gl.uniform3fv(this.uColor3, c3);

        this.gl.uniform1f(this.uWarpStrength, this.options.warpStrength);
        this.gl.uniform1f(this.uWarpFrequency, this.options.warpFrequency);
        this.gl.uniform1f(this.uWarpSpeed, this.options.warpSpeed);
        this.gl.uniform1f(this.uGrainAmount, this.options.grainAmount);
        this.gl.uniform1f(this.uGrainScale, this.options.grainScale);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new Grainient('grainient-canvas', {
        color1: "#1a0b2e", // Deep Purple
        color2: "#2d1b4e", // Dark Violet
        color3: "#0f172a", // Deep Slate/Blue
        timeSpeed: 0.1,    // Slower
        warpStrength: 0.5, // Less distortion
        warpFrequency: 2.0, // Smoother waves
        warpSpeed: 0.5,
        grainAmount: 0.08, // Subtle grain
        grainScale: 1.5
    });
});
