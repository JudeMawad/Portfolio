const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// Raw GLB-local coordinates before the loader recenters and scales the model.
// Axes: +X speaker/right, +Y top, -Z LED/front, +Z rear I/O.
// Edit only the anchor arrays below to tune the feature attachment points.
export const cubeCallouts = [
  {
    id: "usb-c",
    title: "USB–C",
    subtitle: "Adafruit HUSB238",
    anchor: [0, -55, 72.3],
    preferredSide: "right",
    labelOffsetY: 12,
    priority: 3,
    showOnMobile: true
  },
  {
    id: "Air Intake",
    title: "Air Intake",
    subtitle: "Bottom Ventilation",
    anchor: [-30, -72.3, 0],
    preferredSide: "right",
    labelOffsetY: 12,
    priority: 3,
    showOnMobile: true
  },
  {
    id: "rgb-matrix",
    title: "RGB MATRIX",
    subtitle: "64 x 64 P2",
    anchor: [-51, 49, -72.35],
    preferredSide: "left",
    labelOffsetY: -22,
    priority: 1,
    showOnMobile: true
  },
  {
    id: "audio",
    title: "SPEAKER",
    subtitle: "VISATON FR 7 070627",
    anchor: [72.2, 0, 0],
    preferredSide: "right",
    labelOffsetY: 18,
    priority: 2,
    showOnMobile: true
  },
  {
    id: "cooling",
    title: "Cooling Fan",
    subtitle: "Noctua NF-A4x10",
    anchor: [-32.25, 29.25, 72.3], // Center of the modeled rear vent.
    preferredSide: "left",
    labelOffsetY: -20,
    priority: 5,
    showOnMobile: true
  },
  {
    id: "Microphone",
    title: "Microphone",
    subtitle: "RESPEAKER XVF3800",
    anchor: [-1, 72.3, 50], // Exterior proxy; the Pi is not a separate GLB mesh.
    preferredSide: "right",
    labelOffsetY: -42,
    priority: 4,
    showOnMobile: true
  }
];

const createSvgElement = (name) => document.createElementNS(SVG_NAMESPACE, name);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createCubeCalloutSystem = ({
  THREE,
  stage,
  camera,
  model,
  occluders,
  modelRadius,
  definitions = cubeCallouts
}) => {
  if (!THREE || !stage || !camera || !model) {
    throw new Error("Cube callouts require Three.js, a stage, a camera, and a model");
  }

  const overlay = document.createElement("div");
  overlay.className = "cube-callouts";
  overlay.setAttribute("aria-hidden", "true");

  const svg = createSvgElement("svg");
  svg.classList.add("cube-callouts__svg");
  svg.setAttribute("preserveAspectRatio", "none");

  const labelLayer = document.createElement("div");
  labelLayer.className = "cube-callouts__labels";
  overlay.append(svg, labelLayer);
  stage.append(overlay);

  const states = definitions.map((definition) => {
    const connector = createSvgElement("g");
    connector.classList.add("cube-callout-connector");
    connector.dataset.callout = definition.id;

    const line = createSvgElement("path");
    line.classList.add("cube-callout-connector__line");
    line.setAttribute("pathLength", "1");

    const marker = createSvgElement("circle");
    marker.classList.add("cube-callout-connector__marker");
    marker.setAttribute("r", "2.4");
    connector.append(line, marker);
    svg.append(connector);

    const positioner = document.createElement("div");
    positioner.className = "cube-callout-position";
    positioner.dataset.callout = definition.id;

    const label = document.createElement("div");
    label.className = "cube-callout-label";

    const title = document.createElement("span");
    title.className = "cube-callout-label__title";
    title.textContent = definition.title;

    const subtitle = document.createElement("span");
    subtitle.className = "cube-callout-label__subtitle";
    subtitle.textContent = definition.subtitle;

    label.append(title, subtitle);
    positioner.append(label);
    labelLayer.append(positioner);

    return {
      definition,
      connector,
      line,
      marker,
      positioner,
      label,
      localAnchor: new THREE.Vector3(...definition.anchor),
      worldAnchor: new THREE.Vector3(),
      projected: new THREE.Vector3(),
      screenX: 0,
      screenY: 0,
      desiredY: 0,
      labelX: 0,
      labelY: 0,
      labelWidth: 152,
      labelHeight: 34,
      side: definition.preferredSide,
      sideLocked: false,
      coarseVisible: false,
      occluded: true,
      layoutVisible: false,
      isVisible: false,
      lastPath: "",
      lastTransform: ""
    };
  });

  const raycaster = new THREE.Raycaster();
  const cameraPosition = new THREE.Vector3();
  const cameraSpace = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const intersections = [];
  const leftStates = [];
  const rightStates = [];
  const occluderMeshes = (occluders || []).filter((object) => object?.isMesh);
  const surfaceTolerance = Math.max(.012, (modelRadius || 1) * .005);

  let width = 1;
  let height = 1;
  let needsMeasurement = true;
  let forceAllOcclusion = true;
  let occlusionCursor = 0;
  let disposed = false;
  let readyFrame = 0;

  const setVisible = (state, visible) => {
    if (state.isVisible === visible) return;
    state.isVisible = visible;
    state.connector.classList.toggle("is-visible", visible);
    state.positioner.classList.toggle("is-visible", visible);
  };

  const hideAll = () => states.forEach((state) => {
    state.sideLocked = false;
    setVisible(state, false);
  });

  const measureLabels = () => {
    states.forEach((state) => {
      state.labelWidth = Math.max(1, state.positioner.offsetWidth || 152);
      state.labelHeight = Math.max(1, state.label.offsetHeight || 34);
    });
    needsMeasurement = false;
  };

  const resize = (nextWidth, nextHeight) => {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    needsMeasurement = true;
    forceAllOcclusion = true;
    states.forEach((state) => { state.sideLocked = false; });
  };

  const checkOcclusion = (state) => {
    if (!occluderMeshes.length) return false;

    rayDirection.subVectors(state.worldAnchor, cameraPosition);
    const anchorDistance = rayDirection.length();
    if (anchorDistance <= surfaceTolerance) return false;

    rayDirection.multiplyScalar(1 / anchorDistance);
    raycaster.set(cameraPosition, rayDirection);
    raycaster.near = 0;
    raycaster.far = Math.max(0, anchorDistance - surfaceTolerance);
    intersections.length = 0;
    raycaster.intersectObjects(occluderMeshes, false, intersections);
    return intersections.length > 0;
  };

  const chooseSide = (state) => {
    let side = state.definition.preferredSide;
    if (state.screenX < width * .44) side = "left";
    if (state.screenX > width * .56) side = "right";

    const neededSpace = state.labelWidth + 38;
    if (side === "right" && width - state.screenX < neededSpace && state.screenX > neededSpace) side = "left";
    if (side === "left" && state.screenX < neededSpace && width - state.screenX > neededSpace) side = "right";
    return side;
  };

  const placeSide = (list) => {
    if (!list.length) return;

    const top = 10;
    const bottom = height - 10;
    const gap = window.innerWidth <= 900 ? 7 : 10;
    list.sort((a, b) => a.desiredY - b.desiredY);

    let requiredHeight = list.reduce((total, state) => total + state.labelHeight, 0) + gap * (list.length - 1);
    while (list.length > 1 && requiredHeight > bottom - top) {
      let removeIndex = 0;
      for (let index = 1; index < list.length; index += 1) {
        if (list[index].definition.priority > list[removeIndex].definition.priority) removeIndex = index;
      }
      list[removeIndex].layoutVisible = false;
      requiredHeight -= list[removeIndex].labelHeight + gap;
      list.splice(removeIndex, 1);
    }

    let cursor = top;
    list.forEach((state) => {
      state.labelY = Math.max(state.desiredY, cursor);
      cursor = state.labelY + state.labelHeight + gap;
    });

    const overflow = Math.max(0, cursor - gap - bottom);
    if (overflow) list.forEach((state) => { state.labelY -= overflow; });

    cursor = bottom;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const state = list[index];
      state.labelY = Math.min(state.labelY, cursor - state.labelHeight);
      cursor = state.labelY - gap;
    }
  };

  const writePosition = (state) => {
    const edge = window.innerWidth <= 900 ? 5 : 8;
    const bendLength = window.innerWidth <= 900 ? 16 : 24;
    state.labelX = state.side === "right" ? width - edge - state.labelWidth : edge;

    const underlineY = clamp(state.labelY + state.labelHeight + 4, 4, height - 4);
    const labelNearX = state.side === "right" ? state.labelX : state.labelX + state.labelWidth;
    const bendX = clamp(
      labelNearX + (state.side === "right" ? -bendLength : bendLength),
      4,
      width - 4
    );
    const lineEndX = state.side === "right" ? state.labelX + state.labelWidth : state.labelX;
    const path = [
      `M ${state.screenX.toFixed(1)} ${state.screenY.toFixed(1)}`,
      `L ${bendX.toFixed(1)} ${state.screenY.toFixed(1)}`,
      `L ${labelNearX.toFixed(1)} ${underlineY.toFixed(1)}`,
      `L ${lineEndX.toFixed(1)} ${underlineY.toFixed(1)}`
    ].join(" ");
    const transform = `translate3d(${state.labelX.toFixed(1)}px, ${state.labelY.toFixed(1)}px, 0)`;

    if (path !== state.lastPath) {
      state.line.setAttribute("d", path);
      state.marker.setAttribute("cx", state.screenX.toFixed(1));
      state.marker.setAttribute("cy", state.screenY.toFixed(1));
      state.lastPath = path;
    }

    if (transform !== state.lastTransform) {
      state.positioner.style.transform = transform;
      state.lastTransform = transform;
    }

    if (state.positioner.dataset.side !== state.side) {
      state.positioner.dataset.side = state.side;
      state.connector.dataset.side = state.side;
    }
  };

  const update = () => {
    if (disposed || width <= 1 || height <= 1 || !model.visible) {
      hideAll();
      return;
    }

    if (needsMeasurement) measureLabels();
    leftStates.length = 0;
    rightStates.length = 0;
    cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    const mobile = window.innerWidth <= 700;

    states.forEach((state) => {
      state.layoutVisible = false;
      state.worldAnchor.copy(state.localAnchor).applyMatrix4(model.matrixWorld);
      cameraSpace.copy(state.worldAnchor).applyMatrix4(camera.matrixWorldInverse);
      state.projected.copy(state.worldAnchor).project(camera);

      const responsiveVisible = !mobile || state.definition.showOnMobile;
      state.coarseVisible = responsiveVisible
        && cameraSpace.z < -camera.near
        && state.projected.z >= -1
        && state.projected.z <= 1
        && Math.abs(state.projected.x) <= 1.08
        && Math.abs(state.projected.y) <= 1.08;

      state.screenX = (state.projected.x * .5 + .5) * width;
      state.screenY = (-state.projected.y * .5 + .5) * height;
    });

    if (forceAllOcclusion) {
      states.forEach((state) => {
        if (state.coarseVisible) state.occluded = checkOcclusion(state);
      });
      forceAllOcclusion = false;
    } else {
      for (let offset = 0; offset < states.length; offset += 1) {
        const index = (occlusionCursor + offset) % states.length;
        const state = states[index];
        if (!state.coarseVisible) continue;
        state.occluded = checkOcclusion(state);
        occlusionCursor = (index + 1) % states.length;
        break;
      }
    }

    states.forEach((state) => {
      if (!state.coarseVisible || state.occluded) return;
      if (!state.sideLocked) {
        state.side = chooseSide(state);
        state.sideLocked = true;
      }
      state.desiredY = clamp(
        state.screenY + (state.definition.labelOffsetY || 0),
        10,
        Math.max(10, height - state.labelHeight - 10)
      );
      state.layoutVisible = true;
      (state.side === "left" ? leftStates : rightStates).push(state);
    });

    placeSide(leftStates);
    placeSide(rightStates);

    states.forEach((state) => {
      const visible = state.coarseVisible && !state.occluded && state.layoutVisible;
      if (!visible) state.sideLocked = false;
      setVisible(state, visible);
      if (visible) writePosition(state);
    });
  };

  const forceOcclusion = () => {
    forceAllOcclusion = true;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (readyFrame) window.cancelAnimationFrame(readyFrame);
    overlay.remove();
  };

  readyFrame = window.requestAnimationFrame(() => {
    readyFrame = window.requestAnimationFrame(() => {
      if (!disposed) overlay.classList.add("is-ready");
      readyFrame = 0;
    });
  });

  document.fonts?.ready?.then(() => {
    if (disposed) return;
    needsMeasurement = true;
    forceAllOcclusion = true;
    update();
  });

  return { resize, update, forceOcclusion, dispose };
};
