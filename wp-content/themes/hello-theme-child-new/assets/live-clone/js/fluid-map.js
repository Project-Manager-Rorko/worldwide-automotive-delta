
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('fluidCanvas');
    if (!canvas) {
        return;
    }
    // Ensure map canvas fills container (not full window only)
    const parent = canvas.parentElement;
    if (parent) {
        parent.style.position = parent.style.position || 'relative';
        parent.style.minHeight = parent.style.minHeight || '400px';
    }
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        console.error("WebGL not supported");
        // Fallback: show static map image
        const src = canvas.getAttribute('data-src');
        if (src && parent) {
            parent.style.backgroundImage = 'url(' + src + ')';
            parent.style.backgroundSize = 'cover';
            parent.style.backgroundPosition = 'top center';
            parent.style.backgroundRepeat = 'no-repeat';
        }
        return;
    }

    // --- Shaders ---
    const vertexShaderSrc = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
            v_uv = a_position * 0.5 + 0.5;
            v_uv.y = 1.0 - v_uv.y;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSrc = `
        precision highp float;
        uniform sampler2D u_image;
        uniform vec2 u_scale;
        uniform float u_aspect;
        uniform vec2 u_mouse[20];
        uniform float u_time;
        uniform float u_strength;
        varying vec2 v_uv;

        void main() {
            vec2 uv = v_uv;
            vec2 distortion = vec2(0.0);
            
            distortion.x += sin(uv.y * 3.0 + u_time * 0.3) * 0.003;
            distortion.y += cos(uv.x * 3.0 + u_time * 0.3) * 0.003;

            for (int i = 0; i < 20; i++) {
                if (u_mouse[i].x < 0.0) continue;
                vec2 aspectUV = uv * vec2(u_aspect, 1.0);
                vec2 aspectMouse = u_mouse[i] * vec2(u_aspect, 1.0);
                vec2 dir = aspectUV - aspectMouse;
                float dist = length(dir);

                if (dist > 0.0 && dist < 0.4) {
                    float trailStrength = float(20 - i) / 20.0;
                    float wave = sin(dist * 20.0 - u_time * 2.8);
                    float falloff = exp(-dist * 14.0);
                    vec2 displacementDir = normalize(dir) / vec2(u_aspect, 1.0);
                    distortion += displacementDir * wave * falloff * 0.010 * trailStrength * u_strength;
                }
            }

            vec2 distorted_uv = uv + distortion;
            vec2 image_uv = (distorted_uv - 0.5) / u_scale + 0.5;
            
            if (image_uv.x < 0.0 || image_uv.x > 1.0 || image_uv.y < 0.0 || image_uv.y > 1.0) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); 
            } else {
                vec4 texColor = texture2D(u_image, image_uv);
                gl_FragColor = vec4(mix(vec3(1.0), texColor.rgb, texColor.a), 1.0);
            }
        }
    `;

    // --- Helper: Compile Shader ---
    const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // --- Geometry ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Uniform Locations ---
    const uScaleLoc = gl.getUniformLocation(program, 'u_scale');
    const uAspectLoc = gl.getUniformLocation(program, 'u_aspect');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uStrengthLoc = gl.getUniformLocation(program, 'u_strength');

    // --- Texture Handling ---
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const mouseTrail = new Float32Array(20 * 2).fill(-1.0);
    let imageAspect = 1;
    const image = new Image();
    image.crossOrigin = "anonymous"; // Handle CORS if loading from external URLs
    image.src = canvas.getAttribute('data-src');
    
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        imageAspect = image.width / image.height;
        resize();
    };

    // --- Animation & Interaction Logic ---
    let startTime = Date.now();
    let targetMouse = { x: -1, y: -1 };
    let currentMouse = { x: -1, y: -1 };
    let prevMouse = { x: -1, y: -1 };
    let effectStrength = 0.0;
    let lastMoveTime = Date.now();

    const updateMouseTrail = () => {
        if (targetMouse.x >= 0 && currentMouse.x < 0) {
            currentMouse.x = targetMouse.x;
            currentMouse.y = targetMouse.y;
        } else if (targetMouse.x >= 0) {
            currentMouse.x += (targetMouse.x - currentMouse.x) * 0.12;
            currentMouse.y += (targetMouse.y - currentMouse.y) * 0.12;
        }

        if (prevMouse.x >= 0 && currentMouse.x >= 0) {
            const dx = currentMouse.x - prevMouse.x;
            const dy = currentMouse.y - prevMouse.y;
            const movement = Math.sqrt(dx * dx + dy * dy);
            if (movement > 0.5) {
                effectStrength = Math.min(1.0, effectStrength + 0.15);
                lastMoveTime = Date.now();
            } else if (Date.now() - lastMoveTime > 100) {
                effectStrength *= 0.92;
            }
        }

        prevMouse.x = currentMouse.x;
        prevMouse.y = currentMouse.y;

        for (let i = 19; i > 0; i--) {
            mouseTrail[i * 2] = mouseTrail[(i - 1) * 2];
            mouseTrail[i * 2 + 1] = mouseTrail[(i - 1) * 2 + 1];
        }

        if (targetMouse.x < 0) {
            mouseTrail[0] = -1.0;
            mouseTrail[1] = -1.0;
            effectStrength *= 0.85;
        } else {
            const w = Math.max(1, canvas.width);
            const h = Math.max(1, canvas.height);
            mouseTrail[0] = currentMouse.x / w;
            mouseTrail[1] = currentMouse.y / h;
        }
    };

    const resize = () => {
        const rect = (parent || canvas).getBoundingClientRect();
        const displayWidth = Math.max(1, Math.floor(rect.width || window.innerWidth));
        const displayHeight = Math.max(1, Math.floor(rect.height || 400));
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        const canvasAspect = displayWidth / displayHeight;
        const maxW = 1400; 
        
        let targetW = displayWidth;
        let targetH = displayWidth / imageAspect;

        if (targetH > displayHeight) {
            targetH = displayHeight;
            targetW = displayHeight * imageAspect;
        }

        if (targetW > maxW) {
            targetW = maxW;
            targetH = maxW / imageAspect;
        }
        
        gl.useProgram(program);
        gl.uniform2f(uScaleLoc, targetW / displayWidth, targetH / displayHeight);
        gl.uniform1f(uAspectLoc, canvasAspect);
        gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = () => {
        const time = (Date.now() - startTime) / 1000.0;
        updateMouseTrail();

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.uniform1f(uTimeLoc, time);
        gl.uniform2fv(uMouseLoc, mouseTrail);
        gl.uniform1f(uStrengthLoc, effectStrength);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    // Track mouse relative to map canvas for fluid interaction
    const mapHost = parent || canvas;
    mapHost.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        targetMouse.x = e.clientX - r.left;
        targetMouse.y = e.clientY - r.top;
    });
    mapHost.addEventListener('mouseleave', () => {
        targetMouse.x = -1;
        targetMouse.y = -1;
    });
    // Enable pointer events on host so hover works (canvas itself is pointer-events:none in CSS)
    mapHost.style.pointerEvents = 'auto';

    render();
});
