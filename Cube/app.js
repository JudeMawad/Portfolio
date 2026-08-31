(async () => {
  "use strict";

  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  const shouldStartAtTop = !window.location.hash && navigationEntry?.type !== "back_forward";
  if (shouldStartAtTop) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    resetScroll();
    window.addEventListener("load", () => {
      resetScroll();
      window.requestAnimationFrame(() => {
        resetScroll();
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      });
    }, { once: true });
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const header = document.querySelector("[data-project-header]");
  const progress = document.querySelector(".scroll-progress");
  const visual = document.querySelector("[data-cube-visual]");
  const stage = document.querySelector("[data-cube-stage]");
  const canvas = document.querySelector("[data-cube-canvas]");
  const modelStatus = document.querySelector("[data-model-status]");

  let scrollFrame = 0;

  const updateScrollEffects = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) progress.style.transform = `scaleX(${amount})`;
    scrollFrame = 0;
  };

  const queueScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate, { passive: true });

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");

  if (!motionQuery.matches && finePointerQuery.matches && dot && ring) {
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let cursorFrame = 0;

    const renderCursor = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      if (Math.hypot(mouseX - ringX, mouseY - ringY) > .1 && !document.hidden) {
        cursorFrame = window.requestAnimationFrame(renderCursor);
      } else {
        cursorFrame = 0;
      }
    };

    const queueCursorFrame = () => {
      if (!cursorFrame && !document.hidden) cursorFrame = window.requestAnimationFrame(renderCursor);
    };

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      queueCursorFrame();
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, [data-cursor]")));
    });

    document.addEventListener("visibilitychange", queueCursorFrame);
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });

  updateScrollEffects();

  if (!canvas || !visual || !stage) return;

  let renderer;

  const showStaticFallback = () => {
    visual.classList.add("is-model-error");
    if (modelStatus) modelStatus.textContent = "Product Render / Static";
  };

  let THREE;
  let GLTFLoader;
  let RoomEnvironment;
  let EffectComposer;
  let RenderPass;
  let UnrealBloomPass;
  let OutputPass;
  let RectAreaLightUniformsLib;
  let createCubeCalloutSystem;

  try {
    const modules = await Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
      import("three/addons/lights/RectAreaLightUniformsLib.js"),
      import("./cube-callouts.js")
    ]);
    THREE = modules[0];
    ({ GLTFLoader } = modules[1]);
    ({ RoomEnvironment } = modules[2]);
    ({ EffectComposer } = modules[3]);
    ({ RenderPass } = modules[4]);
    ({ UnrealBloomPass } = modules[5]);
    ({ OutputPass } = modules[6]);
    ({ RectAreaLightUniformsLib } = modules[7]);
    ({ createCubeCalloutSystem } = modules[8]);
  } catch (error) {
    showStaticFallback();
    return;
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    showStaticFallback();
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  const presentation = new THREE.Group();
  scene.add(presentation);

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmremGenerator.fromScene(environment, .04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .3;
  environment.dispose();
  pmremGenerator.dispose();

  RectAreaLightUniformsLib.init();

  const keyLight = new THREE.RectAreaLight(0xfff8ef, 8, 5.5, 4.5);
  keyLight.position.set(-3.8, 4.9, -4.8);
  keyLight.lookAt(0, 0, 0);
  scene.add(keyLight);

  const fillLight = new THREE.RectAreaLight(0xe9eef4, 2.4, 4.5, 5);
  fillLight.position.set(4.6, 1.4, -2.8);
  fillLight.lookAt(0, 0, 0);
  scene.add(fillLight);

  const rimLight = new THREE.RectAreaLight(0xfff3e9, 4.6, 3.5, 4.2);
  rimLight.position.set(3, 4.4, 4.6);
  rimLight.lookAt(0, .25, 0);
  scene.add(rimLight);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), .34, .16, 1.18);
  bloomPass.threshold = 0.8;
  bloomPass.strength = 0.1;
  bloomPass.radius = .16;
  const outputPass = new OutputPass();
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  // Initial object composition and drag controls. Position values are world-space offsets.
  const cubeView = Object.freeze({
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 3.55,
    // Higher values add clear space around the Cube for LED bloom and full rotation.
    framingPadding: 1.14,
    idleRotationSpeed: .035,
    dragSensitivity: .006
  });

  const cameraDirection = new THREE.Vector3(1.35, .92, -2.35).normalize();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const modelBounds = new THREE.Sphere();
  const userRotationTarget = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(cubeView.rotationX, cubeView.rotationY, cubeView.rotationZ, "YXZ")
  );
  const idleEuler = new THREE.Euler(0, 0, 0, "YXZ");
  const idleQuaternion = new THREE.Quaternion();
  const composedQuaternion = new THREE.Quaternion();
  const dragYawQuaternion = new THREE.Quaternion();
  const dragPitchQuaternion = new THREE.Quaternion();
  const dragUpAxis = new THREE.Vector3();
  const dragRightAxis = new THREE.Vector3();
  let idleYawAngle = 0;
  let model = null;
  let calloutSystem = null;
  let plasticBumpTexture = null;
  let resizeObserver = null;
  let visibilityObserver = null;
  let animationFrame = 0;
  let lastFrameTime = 0;
  let modelIsVisible = true;
  let pointerIsActive = false;
  let pointerIsDragging = false;
  let activePointerId = null;
  let previousPointerX = 0;
  let previousPointerY = 0;
  let isDisposed = false;
  const listenerController = new AbortController();

  presentation.position.set(cubeView.positionX, cubeView.positionY, cubeView.positionZ);
  presentation.quaternion.copy(userRotationTarget);

  const frameCamera = () => {
    if (!model || !modelBounds.radius) return;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, .1));
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const distance = modelBounds.radius / Math.sin(limitingFov / 2) * cubeView.framingPadding;

    camera.position.copy(cameraDirection).multiplyScalar(distance);
    camera.near = Math.max(.01, distance / 100);
    camera.far = distance * 20;
    camera.lookAt(0, -.04, 0);
    camera.updateProjectionMatrix();
  };

  const renderScene = (deltaTime = 0) => {
    if (isDisposed) return;
    composer.render(deltaTime);
    calloutSystem?.update();
  };

  const resize = () => {
    if (isDisposed) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    camera.aspect = width / height;
    frameCamera();
    camera.updateProjectionMatrix();
    calloutSystem?.resize(width, height);
    renderScene();
  };

  const stopAnimation = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameTime = 0;
  };

  const startAnimation = () => {
    if (animationFrame || !model || isDisposed || motionQuery.matches || !modelIsVisible || document.hidden) return;
    if (!lastFrameTime) lastFrameTime = performance.now();
    animationFrame = window.requestAnimationFrame(animate);
  };

  const animate = (now) => {
    animationFrame = 0;
    if (!model || isDisposed || motionQuery.matches || !modelIsVisible || document.hidden) return;

    const deltaTime = Math.min((now - lastFrameTime) / 1000, .05);
    lastFrameTime = now;
    const pointerEase = 1 - Math.exp(-3 * deltaTime);
    const rotationEase = 1 - Math.exp(-2.15 * deltaTime);

    pointerCurrent.lerp(pointerTarget, pointerEase);
    const autoRotationPaused = pointerIsDragging || pointerIsActive;
    if (!autoRotationPaused) {
      idleYawAngle = (idleYawAngle + deltaTime * cubeView.idleRotationSpeed) % (Math.PI * 2);
    }

    const idleAmount = pointerIsDragging ? 0 : pointerIsActive ? .28 : 1;
    const idlePitch = Math.sin(now * .000073 + .7) * .014 * idleAmount;
    const targetPitch = idlePitch + pointerCurrent.y * .04;
    const targetYaw = idleYawAngle + pointerCurrent.x * .065;

    idleEuler.set(targetPitch, targetYaw, 0);
    idleQuaternion.setFromEuler(idleEuler);
    composedQuaternion.copy(idleQuaternion).multiply(userRotationTarget);
    presentation.quaternion.slerp(composedQuaternion, rotationEase);
    renderScene(deltaTime);
    startAnimation();
  };

  const cubePartMap = Object.freeze({
    enclosure: { nodeName: "Cube", materialName: "Material" },
    ledPanel: { nodeName: "LED_Matrix", materialName: "Material.001" },
    ledPixels: { nodeName: "LEDS", materialName: "Material.004" },
    speakerGrille: { nodeName: "Speaker_Grille", materialName: "Material.003" }
  });

  const resolvePart = (root, definition) => {
    const mesh = root.getObjectByName(definition.nodeName);
    if (!mesh?.isMesh) throw new Error(`Missing Cube mesh: ${definition.nodeName}`);

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const material = materials.find((candidate) => candidate?.name === definition.materialName);
    if (!material?.isMeshStandardMaterial) {
      throw new Error(`Unexpected material on Cube mesh: ${definition.nodeName}`);
    }

    return { mesh, material };
  };

  const createPlasticBumpTexture = () => {
    const size = 256;
    const tileSize = size - 1;
    const noise = new Uint8Array(tileSize * tileSize);
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = size;
    textureCanvas.height = size;
    const context = textureCanvas.getContext("2d");
    if (!context) throw new Error("Unable to create Cube material texture");

    let seed = 0x6d2b79f5;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let index = 0; index < noise.length; index += 1) {
      const fine = (random() - .5) * 20;
      const micro = (random() - .5) * 6;
      noise[index] = Math.round(128 + fine + micro);
    }

    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const sourceX = x === size - 1 ? 0 : x;
        const sourceY = y === size - 1 ? 0 : y;
        const value = noise[sourceY * tileSize + sourceX];
        const offset = (y * size + x) * 4;
        image.data[offset] = value;
        image.data[offset + 1] = value;
        image.data[offset + 2] = value;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.name = "CubePlasticMicroBump";
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    texture.colorSpace = THREE.NoColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    texture.needsUpdate = true;
    return texture;
  };

  const configureCubeMaterials = (root) => {
    const parts = {
      enclosure: resolvePart(root, cubePartMap.enclosure),
      ledPanel: resolvePart(root, cubePartMap.ledPanel),
      ledPixels: resolvePart(root, cubePartMap.ledPixels),
      speakerGrille: resolvePart(root, cubePartMap.speakerGrille)
    };

    plasticBumpTexture = createPlasticBumpTexture();
    parts.enclosure.material.metalness = 0;
    parts.enclosure.material.roughness = .66;
    parts.enclosure.material.bumpMap = plasticBumpTexture;
    parts.enclosure.material.bumpScale = 2;
    parts.enclosure.material.needsUpdate = true;

    parts.ledPanel.material.metalness = 0;
    parts.ledPanel.material.roughness = .56;

    const emissive = parts.ledPixels.material.emissive;
    if (emissive.r + emissive.g + emissive.b < .001) emissive.setRGB(1, .0012, 0);
    parts.ledPixels.material.metalness = 0;
    parts.ledPixels.material.roughness = .48;
    parts.ledPixels.material.emissiveIntensity = 4;

    parts.speakerGrille.material.metalness = 0;
    parts.speakerGrille.material.roughness = .62;

    return parts;
  };

  const disposeModelResources = (root) => {
    if (!root) return;

    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    root.traverse((child) => {
      if (child.geometry) geometries.add(child.geometry);

      const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
      childMaterials.filter(Boolean).forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value?.isTexture) textures.add(value);
        });
      });
    });

    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
  };

  const loader = new GLTFLoader();
  const modelUrl = new URL("../images/THE_CUBE.glb", import.meta.url).href;

  loader.load(
    modelUrl,
    (gltf) => {
      if (isDisposed) {
        disposeModelResources(gltf.scene);
        return;
      }

      try {
        model = gltf.scene;
        const parts = configureCubeMaterials(model);
        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        model.position.sub(center);
        model.scale.setScalar(cubeView.scale / maxDimension);
        presentation.add(model);
        model.updateMatrixWorld(true);
        new THREE.Box3().setFromObject(model).getBoundingSphere(modelBounds);

        frameCamera();
        calloutSystem = createCubeCalloutSystem({
          THREE,
          stage,
          camera,
          model,
          modelRadius: modelBounds.radius,
          occluders: [parts.enclosure.mesh, parts.ledPanel.mesh, parts.speakerGrille.mesh]
        });
        resize();
        visual.classList.add("is-model-ready");
        if (modelStatus) modelStatus.textContent = "Product Render / Live";

        if (motionQuery.matches) {
          presentation.quaternion.copy(userRotationTarget);
          renderScene();
        } else {
          startAnimation();
        }
      } catch (error) {
        calloutSystem?.dispose();
        calloutSystem = null;
        presentation.remove(model);
        disposeModelResources(model);
        model = null;
        showStaticFallback();
      }
    },
    (event) => {
      if (isDisposed || !modelStatus || !event.lengthComputable || !event.total) return;
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      modelStatus.textContent = `Product Render / Loading ${percent}%`;
    },
    () => {
      if (!isDisposed) showStaticFallback();
    }
  );

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
  } else {
    window.addEventListener("resize", resize, {
      passive: true,
      signal: listenerController.signal
    });
  }

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver((entries) => {
      modelIsVisible = entries.some((entry) => entry.isIntersecting);
      if (modelIsVisible) startAnimation();
      else stopAnimation();
    }, { threshold: .02 });
    visibilityObserver.observe(visual);
  }

  stage.addEventListener("pointerenter", () => {
    if (!motionQuery.matches) {
      pointerIsActive = true;
    }
  }, { signal: listenerController.signal });

  stage.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    event.preventDefault();
    activePointerId = event.pointerId;
    pointerIsDragging = true;
    pointerIsActive = true;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    pointerTarget.set(0, 0);
    stage.classList.add("is-dragging");
    stage.setPointerCapture(event.pointerId);
    startAnimation();
  }, { signal: listenerController.signal });

  stage.addEventListener("pointermove", (event) => {
    if (pointerIsDragging && event.pointerId === activePointerId) {
      event.preventDefault();
      const deltaX = event.clientX - previousPointerX;
      const deltaY = event.clientY - previousPointerY;
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;

      dragUpAxis.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
      dragRightAxis.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
      dragYawQuaternion.setFromAxisAngle(dragUpAxis, deltaX * cubeView.dragSensitivity);
      dragPitchQuaternion.setFromAxisAngle(dragRightAxis, deltaY * cubeView.dragSensitivity);
      userRotationTarget.premultiply(dragYawQuaternion).premultiply(dragPitchQuaternion).normalize();
      pointerTarget.set(0, 0);
      calloutSystem?.forceOcclusion();

      if (motionQuery.matches) {
        presentation.quaternion.copy(userRotationTarget);
        renderScene();
      }
      return;
    }

    if (!motionQuery.matches && finePointerQuery.matches) {
      const rect = stage.getBoundingClientRect();
      pointerTarget.set(
        THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1)
      );
    }
  }, { signal: listenerController.signal });

  const finishDrag = (event) => {
    if (!pointerIsDragging || event.pointerId !== activePointerId) return;

    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    pointerIsDragging = false;
    activePointerId = null;
    pointerIsActive = finePointerQuery.matches && stage.matches(":hover");
    pointerTarget.set(0, 0);
    stage.classList.remove("is-dragging");
    calloutSystem?.forceOcclusion();
    if (motionQuery.matches) renderScene();
  };

  stage.addEventListener("pointerup", finishDrag, { signal: listenerController.signal });
  stage.addEventListener("pointercancel", finishDrag, { signal: listenerController.signal });

  stage.addEventListener("pointerleave", () => {
    if (!pointerIsDragging) {
      pointerIsActive = false;
      pointerTarget.set(0, 0);
    }
  }, { signal: listenerController.signal });

  motionQuery.addEventListener("change", () => {
    pointerTarget.set(0, 0);
    pointerCurrent.set(0, 0);
    calloutSystem?.forceOcclusion();

    if (motionQuery.matches) {
      stopAnimation();
      presentation.quaternion.copy(userRotationTarget);
      renderScene();
    } else {
      startAnimation();
    }
  }, { signal: listenerController.signal });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  }, { signal: listenerController.signal });

  const disposeCubeScene = () => {
    if (isDisposed) return;
    isDisposed = true;
    stopAnimation();
    listenerController.abort();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    calloutSystem?.dispose();
    calloutSystem = null;

    scene.environment = null;
    environmentTarget.dispose();
    disposeModelResources(model);
    plasticBumpTexture = null;
    bloomPass.dispose();
    outputPass.dispose();
    renderPass.dispose();
    composer.dispose();
    renderer.dispose();
  };

  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) disposeCubeScene();
  }, { signal: listenerController.signal });

  resize();
})();
