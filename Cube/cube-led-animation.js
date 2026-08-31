const MATRIX_SIZE = 64;
const PIXEL_COUNT = MATRIX_SIZE * MATRIX_SIZE;
const FRAME_TIME_MS = 33;
const NOISE_SCALE = 31;

const PERMUTATION = new Uint8Array([
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
  247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
  57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
  65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
  200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
  52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
  207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
  119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
  81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
  222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
]);

// Exact seven-stop RGB palette from fastled-noise.cc.
const PALETTE = new Uint8Array([
  0, 110, 32,
  0, 110, 32,
  230, 8, 4,
  230, 8, 4,
  255, 92, 0,
  255, 92, 0,
  0, 110, 32
]);

export const CUBE_ANIMATION_STATES = Object.freeze({
  idle: Object.freeze({ brightness: 10, speed: 3.5, hueRate: .12 }),
  wake: Object.freeze({ brightness: 50, speed: 18, hueRate: .55 }),
  listening: Object.freeze({ brightness: 50, speed: 12, hueRate: .35 }),
  thinking: Object.freeze({ brightness: 50, speed: 8, hueRate: .28 }),
  speaking: Object.freeze({ brightness: 50, speed: 10, hueRate: .30 }),
  followup: Object.freeze({ brightness: 50, speed: 6, hueRate: .22 })
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lround = (value) => value < 0 ? Math.ceil(value - .5) : Math.floor(value + .5);
const perm = (index) => PERMUTATION[index & 0xff];
const fade = (value) => value * value * value * (value * (value * 6 - 15) + 10);
const lerp = (from, to, amount) => from + amount * (to - from);

const gradient = (hash, x, y, z) => {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
};

export const perlinNoise = (x, y, z) => {
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);
  const floorZ = Math.floor(z);
  const xi = floorX & 0xff;
  const yi = floorY & 0xff;
  const zi = floorZ & 0xff;
  const xf = x - floorX;
  const yf = y - floorY;
  const zf = z - floorZ;
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const aaa = perm(perm(perm(xi) + yi) + zi);
  const aba = perm(perm(perm(xi) + yi + 1) + zi);
  const aab = perm(perm(perm(xi) + yi) + zi + 1);
  const abb = perm(perm(perm(xi) + yi + 1) + zi + 1);
  const baa = perm(perm(perm(xi + 1) + yi) + zi);
  const bba = perm(perm(perm(xi + 1) + yi + 1) + zi);
  const bab = perm(perm(perm(xi + 1) + yi) + zi + 1);
  const bbb = perm(perm(perm(xi + 1) + yi + 1) + zi + 1);

  const x1 = lerp(
    gradient(aaa, xf, yf, zf),
    gradient(baa, xf - 1, yf, zf),
    u
  );
  const x2 = lerp(
    gradient(aba, xf, yf - 1, zf),
    gradient(bba, xf - 1, yf - 1, zf),
    u
  );
  const y1 = lerp(x1, x2, v);
  const x3 = lerp(
    gradient(aab, xf, yf, zf - 1),
    gradient(bab, xf - 1, yf, zf - 1),
    u
  );
  const x4 = lerp(
    gradient(abb, xf, yf - 1, zf - 1),
    gradient(bbb, xf - 1, yf - 1, zf - 1),
    u
  );
  const y2 = lerp(x3, x4, v);
  return lerp(y1, y2, w);
};

export const noise8 = (x, y, z) => clamp(
  lround((perlinNoise((x & 0xffff) / 256, (y & 0xffff) / 256, (z & 0xffff) / 256) + 1) * 127.5),
  0,
  255
);

const randomUint16 = () => {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint16Array(1))[0];
  }
  return Math.floor(Math.random() * 65536);
};

const createLedCoordinateAttribute = (THREE, geometry) => {
  const positions = geometry.getAttribute("position");
  if (!positions || positions.itemSize !== 3) {
    throw new Error("Cube LED mesh requires a three-component position attribute");
  }

  const coordinates = new Float32Array(positions.count * 2);
  const verticesPerPixel = new Uint16Array(PIXEL_COUNT);

  for (let index = 0; index < positions.count; index += 1) {
    // The GLB stores columns along local +X and rows bottom-to-top along local -Z.
    // The source program addresses its matrix from the top-left, so Y is flipped once here.
    const sourceX = Math.round(positions.getX(index) / 4);
    const geometryRow = Math.round(-positions.getZ(index) / 4);
    const sourceY = MATRIX_SIZE - 1 - geometryRow;

    if (
      sourceX < 0 || sourceX >= MATRIX_SIZE ||
      sourceY < 0 || sourceY >= MATRIX_SIZE
    ) {
      throw new Error(`Cube LED vertex ${index} falls outside the 64x64 matrix`);
    }

    coordinates[index * 2] = sourceX;
    coordinates[index * 2 + 1] = sourceY;
    verticesPerPixel[sourceY * MATRIX_SIZE + sourceX] += 1;
  }

  let mappedPixelCount = 0;
  let minimumVerticesPerPixel = Number.POSITIVE_INFINITY;
  let maximumVerticesPerPixel = 0;
  verticesPerPixel.forEach((count) => {
    if (count > 0) mappedPixelCount += 1;
    minimumVerticesPerPixel = Math.min(minimumVerticesPerPixel, count);
    maximumVerticesPerPixel = Math.max(maximumVerticesPerPixel, count);
  });

  if (mappedPixelCount !== PIXEL_COUNT) {
    throw new Error(`Cube LED mapping resolved ${mappedPixelCount} of ${PIXEL_COUNT} pixels`);
  }

  geometry.setAttribute("cubeLedCoord", new THREE.BufferAttribute(coordinates, 2));
  return {
    mappedPixelCount,
    vertexCount: positions.count,
    minimumVerticesPerPixel,
    maximumVerticesPerPixel
  };
};

const configureLedMaterial = ({ THREE, material, texture, brightnessUniform, emissionGain }) => {
  const originalOnBeforeCompile = material.onBeforeCompile;
  const originalProgramCacheKey = material.customProgramCacheKey;
  const originalMaterialState = {
    color: material.color.clone(),
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
    metalness: material.metalness,
    roughness: material.roughness
  };

  material.color.setRGB(.01, .01, .01);
  material.emissive.setRGB(0, 0, 0);
  material.emissiveIntensity = 1;
  material.metalness = 0;
  material.roughness = .48;

  material.onBeforeCompile = function onBeforeCompile(shader, renderer) {
    originalOnBeforeCompile.call(this, shader, renderer);
    shader.uniforms.cubeLedTexture = { value: texture };
    shader.uniforms.cubeLedBrightness = brightnessUniform;
    shader.uniforms.cubeLedEmissionGain = { value: emissionGain };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec2 cubeLedCoord;\nvarying vec2 vCubeLedCoord;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCubeLedCoord = cubeLedCoord;"
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D cubeLedTexture;\nuniform float cubeLedBrightness;\nuniform float cubeLedEmissionGain;\nvarying vec2 vCubeLedCoord;"
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        [
          "vec4 diffuseColor = vec4( diffuse, opacity );",
          `vec2 cubeLedUv = (vCubeLedCoord + 0.5) / ${MATRIX_SIZE.toFixed(1)};`,
          "vec3 cubeLedColor = texture2D(cubeLedTexture, cubeLedUv).rgb;",
          "diffuseColor.rgb = vec3(0.003) + cubeLedColor * cubeLedBrightness * 0.12;"
        ].join("\n")
      )
      .replace(
        "vec3 totalEmissiveRadiance = emissive;",
        "vec3 totalEmissiveRadiance = cubeLedColor * cubeLedBrightness * cubeLedEmissionGain;"
      );
  };

  material.customProgramCacheKey = () => `${originalProgramCacheKey.call(material)}|cube-fastled-noise-v1`;
  material.needsUpdate = true;

  return () => {
    material.color.copy(originalMaterialState.color);
    material.emissive.copy(originalMaterialState.emissive);
    material.emissiveIntensity = originalMaterialState.emissiveIntensity;
    material.metalness = originalMaterialState.metalness;
    material.roughness = originalMaterialState.roughness;
    material.onBeforeCompile = originalOnBeforeCompile;
    material.customProgramCacheKey = originalProgramCacheKey;
    material.needsUpdate = true;
  };
};

export const createCubeLedAnimation = ({
  THREE,
  mesh,
  material,
  reducedMotion = false,
  debug = false,
  emissionGain = 15

}) => {
  if (!THREE || !mesh?.isMesh || !material?.isMeshStandardMaterial) {
    throw new Error("Cube LED animation requires Three.js and the LED MeshStandardMaterial");
  }

  const mapping = createLedCoordinateAttribute(THREE, mesh.geometry);
  const noise = new Uint8Array(PIXEL_COUNT);
  const pixelData = new Uint8Array(PIXEL_COUNT * 4);
  const xCoordinates = new Uint16Array(MATRIX_SIZE);
  const yCoordinates = new Uint16Array(MATRIX_SIZE);
  const noiseX = randomUint16();
  const noiseY = randomUint16();
  let noiseZ = randomUint16();

  for (let index = 0; index < MATRIX_SIZE; index += 1) {
    xCoordinates[index] = (noiseX + NOISE_SCALE * index) & 0xffff;
    yCoordinates[index] = (noiseY + NOISE_SCALE * index) & 0xffff;
  }

  for (let index = 0; index < PIXEL_COUNT; index += 1) {
    pixelData[index * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(
    pixelData,
    MATRIX_SIZE,
    MATRIX_SIZE,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.name = "CubeFastLedNoise64x64";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.unpackAlignment = 1;

  const brightnessUniform = { value: .1 };
  const restoreMaterial = configureLedMaterial({
    THREE,
    material,
    texture,
    brightnessUniform,
    emissionGain
  });

  let mode = "idle";
  let targetBrightness = CUBE_ANIMATION_STATES.idle.brightness;
  let targetSpeed = CUBE_ANIMATION_STATES.idle.speed;
  let targetHueRate = CUBE_ANIMATION_STATES.idle.hueRate;
  let targetVoiceLevel = 0;
  let brightness = 10;
  let speed = 3.5;
  let hueRate = .12;
  let huePhase = 0;
  let voiceLevel = 0;
  let lastVoiceUpdate = performance.now();
  let lastStateUpdate = lastVoiceUpdate;
  let lastSimulationTime = 0;
  let reduced = Boolean(reducedMotion);
  let debugEnabled = Boolean(debug);
  let disposed = false;
  let frameCount = 0;
  let averageUpdateMs = 0;

  const applyState = (nextMode, now = performance.now()) => {
    const normalized = String(nextMode).toLowerCase() === "speech"
      ? "speaking"
      : String(nextMode).toLowerCase();
    const state = CUBE_ANIMATION_STATES[normalized];
    if (!state) return false;

    mode = normalized;
    targetBrightness = state.brightness;
    targetSpeed = state.speed;
    targetHueRate = state.hueRate;
    targetVoiceLevel = 0;
    lastStateUpdate = now;
    return true;
  };

  const applyVoiceLevel = (nextLevel, now = performance.now()) => {
    const parsedLevel = Number(nextLevel);
    if (!Number.isFinite(parsedLevel)) return false;

    const state = CUBE_ANIMATION_STATES.speaking;
    mode = "speaking";
    targetBrightness = state.brightness;
    targetSpeed = state.speed;
    targetHueRate = state.hueRate;
    targetVoiceLevel = clamp(parsedLevel, 0, 1);
    lastVoiceUpdate = now;
    lastStateUpdate = now;
    return true;
  };

  const updateControlValues = (now) => {
    if (mode === "speaking" && now - lastVoiceUpdate > 180) {
      targetVoiceLevel = 0;
    }
    if (mode !== "idle" && now - lastStateUpdate > 15000) {
      applyState("idle", now);
    }

    voiceLevel += (targetVoiceLevel - voiceLevel) * .28;
    const requestedSpeed = targetSpeed + voiceLevel * 38;
    const requestedHueRate = targetHueRate + voiceLevel * 1.35;
    speed += (requestedSpeed - speed) * .10;
    hueRate += (requestedHueRate - hueRate) * .12;
    const brightnessResponse = targetBrightness > brightness ? .22 : .045;
    brightness += (targetBrightness - brightness) * brightnessResponse;
    brightnessUniform.value = clamp(lround(brightness), 1, 100) / 100;
  };

  const writeDebugFrame = () => {
    pixelData.fill(0);
    for (let index = 0; index < PIXEL_COUNT; index += 1) {
      pixelData[index * 4 + 3] = 255;
    }

    const setPixel = (x, y, red, green, blue) => {
      const offset = (y * MATRIX_SIZE + x) * 4;
      pixelData[offset] = red;
      pixelData[offset + 1] = green;
      pixelData[offset + 2] = blue;
    };
    setPixel(0, 0, 255, 0, 0);
    setPixel(MATRIX_SIZE - 1, 0, 0, 255, 0);
    setPixel(0, MATRIX_SIZE - 1, 0, 0, 255);
    setPixel(MATRIX_SIZE - 1, MATRIX_SIZE - 1, 255, 255, 255);
    brightnessUniform.value = 1;
    texture.needsUpdate = true;
  };

  const writeNoiseFrame = () => {
    // This follows fastled-noise.cc's frame order: sample Z, then advance it.
    const sampledZ = Math.trunc(noiseZ) & 0xffff;
    for (let x = 0; x < MATRIX_SIZE; x += 1) {
      for (let y = 0; y < MATRIX_SIZE; y += 1) {
        noise[y * MATRIX_SIZE + x] = noise8(xCoordinates[x], yCoordinates[y], sampledZ);
      }
    }
    noiseZ += speed;

    const roundedHue = lround(huePhase) & 0xff;
    for (let y = 0; y < MATRIX_SIZE; y += 1) {
      for (let x = 0; x < MATRIX_SIZE; x += 1) {
        const pixelBrightness = noise[y * MATRIX_SIZE + x];
        // The source intentionally transposes only the palette lookup, not brightness.
        const transposedNoise = noise[x * MATRIX_SIZE + y];
        const palettePosition = (roundedHue + transposedNoise) & 0xff;
        const scaledPosition = palettePosition * 6;
        const segment = Math.min(scaledPosition >> 8, 5);
        const amount = scaledPosition & 0xff;
        const inverse = 255 - amount;
        const from = segment * 3;
        const to = from + 3;
        const output = (y * MATRIX_SIZE + x) * 4;

        for (let channel = 0; channel < 3; channel += 1) {
          const blended = Math.floor(
            (PALETTE[from + channel] * inverse + PALETTE[to + channel] * amount + 127) / 255
          );
          pixelData[output + channel] = Math.floor((blended * pixelBrightness + 127) / 255);
        }
      }
    }

    huePhase += hueRate;
    if (huePhase >= 256) huePhase %= 256;
    texture.needsUpdate = true;
  };

  const simulateFrame = (now) => {
    const started = performance.now();
    updateControlValues(now);
    if (debugEnabled) writeDebugFrame();
    else writeNoiseFrame();
    const elapsed = performance.now() - started;
    averageUpdateMs = frameCount ? averageUpdateMs * .9 + elapsed * .1 : elapsed;
    frameCount += 1;
  };

  const update = (now = performance.now()) => {
    if (disposed || reduced || debugEnabled) return false;
    if (!lastSimulationTime || now - lastSimulationTime > 250) {
      lastSimulationTime = now - FRAME_TIME_MS;
    }
    // Preserve the physical display's 33 ms cadence even when Three.js renders faster.
    const elapsed = now - lastSimulationTime;
    if (elapsed < FRAME_TIME_MS) return false;

    lastSimulationTime = now - (elapsed % FRAME_TIME_MS);
    simulateFrame(now);
    return true;
  };

  const setReducedMotion = (nextReduced) => {
    reduced = Boolean(nextReduced);
    lastSimulationTime = 0;
    if (reduced && !debugEnabled) {
      updateControlValues(performance.now());
      writeNoiseFrame();
    }
  };

  const setDebugMode = (enabled) => {
    debugEnabled = Boolean(enabled);
    lastSimulationTime = 0;
    if (debugEnabled) writeDebugFrame();
    else {
      brightnessUniform.value = clamp(lround(brightness), 1, 100) / 100;
      writeNoiseFrame();
    }
  };

  const setState = (nextMode, now = performance.now()) => {
    const applied = applyState(nextMode, now);
    if (applied && reduced && !debugEnabled) {
      updateControlValues(now);
      writeNoiseFrame();
    }
    return applied;
  };

  const setVoiceLevel = (nextLevel, now = performance.now()) => {
    const applied = applyVoiceLevel(nextLevel, now);
    if (applied && reduced && !debugEnabled) {
      updateControlValues(now);
      writeNoiseFrame();
    }
    return applied;
  };

  const getDiagnostics = () => ({
    logicalPixelCount: PIXEL_COUNT,
    mappedPixelCount: mapping.mappedPixelCount,
    vertexCount: mapping.vertexCount,
    minimumVerticesPerPixel: mapping.minimumVerticesPerPixel,
    maximumVerticesPerPixel: mapping.maximumVerticesPerPixel,
    mapping: "GLB local +X left-to-right; local -Z bottom-to-top; source Y flipped to top-left origin",
    state: mode,
    brightness,
    speed,
    hueRate,
    voiceLevel,
    frameTimeMs: FRAME_TIME_MS,
    frameCount,
    averageUpdateMs,
    reducedMotion: reduced,
    debug: debugEnabled
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    mesh.geometry.deleteAttribute("cubeLedCoord");
    restoreMaterial();
    texture.dispose();
  };

  const initialSimulationTime = performance.now();
  simulateFrame(initialSimulationTime);
  lastSimulationTime = initialSimulationTime;

  return {
    setState,
    setVoiceLevel,
    setReducedMotion,
    setDebugMode,
    getDiagnostics,
    update,
    dispose
  };
};
