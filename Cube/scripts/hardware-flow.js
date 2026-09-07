export function setupHardwareFlow() {
  const hardwareDesktopQuery = window.matchMedia("(min-width: 901px)");
  const clampUnit = (value) => Math.min(1, Math.max(0, value));
  const hardwareFlows = [...document.querySelectorAll("[data-hardware-flow]")].map((flow) => {
    const sequence = flow.querySelector("[data-hardware-sequence]");
    const distribution = flow.querySelector("[data-hardware-distribution]");
    const connectors = flow.querySelector("[data-hardware-connectors]");

    return {
      flow,
      sequence,
      items: [...(sequence?.querySelectorAll("[data-hardware-item]") ?? [])],
      markers: [...(sequence?.querySelectorAll(".cube-hardware__marker") ?? [])],
      distribution,
      supportList: distribution?.querySelector("[data-hardware-support-list]") ?? null,
      supportItems: [...(distribution?.querySelectorAll("[data-hardware-support-item]") ?? [])],
      connectors,
      spineBase: [...(connectors?.querySelectorAll("[data-hardware-spine-path='base']") ?? [])],
      spineActive: [...(connectors?.querySelectorAll("[data-hardware-spine-path='active']") ?? [])],
      branchBase: [...(connectors?.querySelectorAll("[data-hardware-branch-path='base']") ?? [])],
      branchActive: [...(connectors?.querySelectorAll("[data-hardware-branch-path='active']") ?? [])],
      endpointBase: [...(connectors?.querySelectorAll("[data-hardware-endpoint='base']") ?? [])],
      endpointActive: [...(connectors?.querySelectorAll("[data-hardware-endpoint='active']") ?? [])],
      junctionBase: connectors?.querySelector("[data-hardware-junction='base']") ?? null,
      junctionActive: connectors?.querySelector("[data-hardware-junction='active']") ?? null,
      spineRanges: [],
      branchRanges: [],
      junctionY: 0,
      geometryDirty: true
    };
  });

  let scrollFrame = 0;
  let hardwareResizeObserver = null;

  const setHardwarePath = (basePath, activePath, pathData) => {
    basePath?.setAttribute("d", pathData);
    activePath?.setAttribute("d", pathData);
  };

  const setHardwareNode = (node, x, y, radius) => {
    if (!node) return;
    node.setAttribute("cx", x.toFixed(2));
    node.setAttribute("cy", y.toFixed(2));
    node.setAttribute("r", radius.toFixed(2));
  };

  const updateHardwareGeometry = (hardware) => {
    const {
      flow,
      sequence,
      distribution,
      supportList,
      supportItems,
      markers,
      connectors,
      spineBase,
      spineActive,
      branchBase,
      branchActive,
      endpointBase,
      endpointActive,
      junctionBase,
      junctionActive
    } = hardware;

    if (
      !flow ||
      !sequence ||
      !distribution ||
      !supportList ||
      !connectors ||
      markers.length !== 4 ||
      supportItems.length !== 4 ||
      spineBase.length !== 4 ||
      spineActive.length !== 4 ||
      branchBase.length !== 4 ||
      branchActive.length !== 4 ||
      endpointBase.length !== 4 ||
      endpointActive.length !== 4
    ) return;

    const flowRect = flow.getBoundingClientRect();
    const distributionRect = distribution.getBoundingClientRect();
    const supportListRect = supportList.getBoundingClientRect();
    const markerPoints = markers.map((marker) => {
      const rect = marker.getBoundingClientRect();
      return {
        x: rect.left - flowRect.left + rect.width / 2,
        y: rect.top - flowRect.top + rect.height / 2
      };
    });
    const itemRects = supportItems.map((item) => item.getBoundingClientRect());
    const width = Math.max(1, flowRect.width);
    const height = Math.max(1, flowRect.height);
    const supportTop = distributionRect.top - flowRect.top;
    const firstBoxTop = Math.min(...itemRects.map((rect) => rect.top - flowRect.top));
    const connectorGap = Math.max(1, firstBoxTop - supportTop);
    const supportCenterX = supportListRect.left - flowRect.left + supportListRect.width / 2;
    let junctionX;
    let junctionY;
    let branchPaths;
    let endpointPoints;

    if (hardwareDesktopQuery.matches) {
      junctionX = supportCenterX;
      junctionY = supportTop + connectorGap * .62;
      endpointPoints = itemRects.map((rect) => ({
        x: rect.left - flowRect.left + rect.width / 2,
        y: rect.top - flowRect.top
      }));
      branchPaths = endpointPoints.map(({ x, y }) => (
        `M${junctionX.toFixed(2)} ${junctionY.toFixed(2)}H${x.toFixed(2)}V${y.toFixed(2)}`
      ));
    } else {
      junctionX = markerPoints.at(-1).x;
      junctionY = supportTop + connectorGap * .5;
      endpointPoints = itemRects.map((rect) => ({
        x: rect.left - flowRect.left,
        y: rect.top - flowRect.top + rect.height / 2
      }));
      branchPaths = endpointPoints.map(({ x, y }) => (
        `M${junctionX.toFixed(2)} ${junctionY.toFixed(2)}V${y.toFixed(2)}H${x.toFixed(2)}`
      ));
    }

    const spineTargets = [...markerPoints.slice(1), { x: junctionX, y: junctionY }];
    const spinePaths = markerPoints.map((point, index) => {
      const target = spineTargets[index];
      return `M${point.x.toFixed(2)} ${point.y.toFixed(2)}V${target.y.toFixed(2)}H${target.x.toFixed(2)}`;
    });

    connectors.setAttribute("viewBox", `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`);
    connectors.setAttribute("preserveAspectRatio", "none");
    spinePaths.forEach((pathData, index) => {
      setHardwarePath(spineBase[index], spineActive[index], pathData);
    });
    branchPaths.forEach((pathData, index) => {
      setHardwarePath(branchBase[index], branchActive[index], pathData);
    });

    const junctionRadius = hardwareDesktopQuery.matches ? 3 : 2.5;
    const endpointRadius = hardwareDesktopQuery.matches ? 2.5 : 2;
    endpointPoints.forEach(({ x, y }, index) => {
      setHardwareNode(endpointBase[index], x, y, endpointRadius);
      setHardwareNode(endpointActive[index], x, y, endpointRadius);
    });
    setHardwareNode(junctionBase, junctionX, junctionY, junctionRadius);
    setHardwareNode(junctionActive, junctionX, junctionY, junctionRadius);

    hardware.spineRanges = markerPoints.map((point, index) => ({
      start: point.y,
      end: spineTargets[index].y
    }));
    hardware.branchRanges = endpointPoints.map(({ y }) => ({ start: junctionY, end: y }));
    hardware.junctionY = junctionY;
    hardware.geometryDirty = false;
  };

  const getHardwarePathProgress = (position, start, end) => (
    clampUnit((position - start) / Math.max(1, end - start))
  );

  const updateHardwareConnectorProgress = (hardware, readingLine) => {
    const { flow, spineActive, branchActive, endpointActive, junctionActive } = hardware;
    if (!flow || spineActive.length !== 4 || branchActive.length !== 4) return;
    if (hardware.geometryDirty) updateHardwareGeometry(hardware);
    if (hardware.geometryDirty) return;

    const flowRect = flow.getBoundingClientRect();
    const localReadingLine = readingLine - flowRect.top;
    const junctionEnd = hardware.junctionY + 8;

    spineActive.forEach((path, index) => {
      const range = hardware.spineRanges[index];
      const pathProgress = getHardwarePathProgress(localReadingLine, range.start, range.end);
      path.style.strokeDashoffset = (1 - pathProgress).toFixed(4);
    });

    const junctionProgress = getHardwarePathProgress(localReadingLine, hardware.junctionY, junctionEnd);
    branchActive.forEach((path, index) => {
      const range = hardware.branchRanges[index];
      const branchProgress = getHardwarePathProgress(localReadingLine, junctionEnd, range.end);
      path.style.strokeDashoffset = (1 - branchProgress).toFixed(4);
      const endpoint = endpointActive[index];
      const endpointProgress = clampUnit((branchProgress - .9) / .1);
      endpoint.style.opacity = endpointProgress.toFixed(4);
    });
    if (junctionActive) junctionActive.style.opacity = junctionProgress.toFixed(4);
  };

  const updateHardwareSequence = (hardware) => {
    const { sequence, items } = hardware;
    if (!items.length) return;

    const sequenceRect = sequence.getBoundingClientRect();
    const readingLine = window.innerHeight * .48;
    updateHardwareConnectorProgress(hardware, readingLine);

    let activeItem = null;
    if (sequenceRect.top <= readingLine && sequenceRect.bottom >= readingLine) {
      let nearestDistance = Number.POSITIVE_INFINITY;
      items.forEach((item) => {
        const distance = Math.abs(item.getBoundingClientRect().top - readingLine);
        if (distance >= nearestDistance) return;
        nearestDistance = distance;
        activeItem = item;
      });
    }

    items.forEach((item) => item.classList.toggle("is-active", item === activeItem));
  };

  const updateScrollEffects = () => {
    hardwareFlows.forEach(updateHardwareSequence);
    scrollFrame = 0;
  };

  const queueScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  };

  const invalidateHardwareGeometry = () => {
    hardwareFlows.forEach((hardware) => {
      hardware.geometryDirty = true;
    });
    queueScrollUpdate();
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", invalidateHardwareGeometry, { passive: true });
  hardwareDesktopQuery.addEventListener("change", invalidateHardwareGeometry);

  if ("ResizeObserver" in window) {
    hardwareResizeObserver = new ResizeObserver(invalidateHardwareGeometry);
    hardwareFlows.forEach(({ flow, sequence, distribution, supportList }) => {
      if (flow) hardwareResizeObserver.observe(flow);
      if (sequence) hardwareResizeObserver.observe(sequence);
      if (distribution) hardwareResizeObserver.observe(distribution);
      if (supportList) hardwareResizeObserver.observe(supportList);
    });
  }

  updateScrollEffects();
  return {
    dispose() {
      window.removeEventListener("scroll", queueScrollUpdate);
      window.removeEventListener("resize", invalidateHardwareGeometry);
      hardwareDesktopQuery.removeEventListener("change", invalidateHardwareGeometry);
      hardwareResizeObserver?.disconnect();
      window.cancelAnimationFrame(scrollFrame);
    }
  };
}
