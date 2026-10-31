"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { products, type Product } from "@/data/products";

/* ============================================================
   FruitSlider v6.4 — Nature Stage（Splash 已移除）
   · 分层背景：净版底图 + 棕榈叶影(漂移) + 植物(轻摆, cover 映射定位)
   · 入场：品牌 0.15s 淡入 → 首模型就绪 +0.8s 水果淡入上移落座
   · 切换：拖拽/滚轮 → 旧果淡出下沉、新果淡入上移（spring ≈0.6s）
   · 悬停：放大 2.5% + 停留 260ms 后慢转(4.2s/圈) + 信息卡片
   · 触屏：按住水果搓转；拖拽空白切换
   · 接触阴影：DOM 双层 multiply，恒印在陶土台座上
============================================================ */

/* 底图已 baked 植物时改为 false（植物层隐藏，其余动画不变） */
const SHOW_PLANT_LAYERS = true;

const PX2W = 1 / 100;
const FOV = 35;
const WHEEL_SPEED = 1.2, DRAG_SPEED = 1.6, FLING_SPEED = 200, FLING_CLAMP = 3.0;
const HOVER_BOOST = 1.025;
const ENTER_DELAY = 800;
const LIFT_PX = 46;

/* 悬停自转 */
const REV_MS = 4200;
const SPIN_DPS = 360 / (REV_MS / 1000);
const TOUCH_SPIN_DEG = 0.45;
const SPIN_SPRING_STIFF = 60, REST_SNAP_K = 6;

/* 三果落位（屏幕宽度比例） */
const TRIO_LEFT = 0.26;
const SIZE_BY_SLUG: Record<string, number> = {
  durian: 1.05, dragonfruit: 0.95, papaya: 1.15, hamimelon: 1.0, potato: 0.85, passionfruit: 0.82,
};
const POSE_BY_SLUG: Record<string, number> = {
  durian: 0.05, dragonfruit: -0.10, papaya: 0.20, hamimelon: 0.06, potato: 0.10, passionfruit: -0.06,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ============ 台座落地标定（hero-nature-bg.jpg）============
   陷进台座 → 调小 STAGE_FY_*；悬空 → 调大；步长 0.005 */
const STAGE_SPAN_X: [number, number] = [0.18, 0.82];
const STAGE_FY_EDGE = 0.70;
const STAGE_FY_CENTER = 0.74;
const GROUND_SINK = 0.035;
const BG_POS_Y_DESKTOP = 0.62;   // 与 CSS background-position 一致
const BG_POS_Y_MOBILE = 0.70;
const MOBILE_BP = 768;

/* ============ 植物层标定（底图宽度/高度比例）============
   PLANT_LEFT：整张枝叶矩形。
   PLANT_RIGHT：只渲染 PNG 上部植物（裁掉自带木箱），
   fy = 植物顶端在底图中的高度比例；对齐底图箱口≈0.48。 */
const PLANT_LEFT = { fx: -0.020, fy: -0.024, fw: 0.393 };
const PLANT_RIGHT = { fx: 0.760, fy: 0.192, fw: 0.300 };
const PNG_RIGHT_ASPECT = 0.825;      // plant-right.png 高/宽
const PNG_RIGHT_PLANTS_FRAC = 0.654; // 植物部分占 PNG 高度比例（箱口以上）

/* 接触阴影布局（光来自左上 → 阴影偏右下） */
const SH_SOFT = { dx: 0.10, dy: 0.05, sw: 1.35, sh: 0.42, op: 0.85 };
const SH_CORE = { dx: 0.06, dy: 0.015, sw: 0.66, sh: 0.18, op: 0.95 };

const depthScale = (x: number) => 0.92 + 0.14 * Math.sin(Math.PI * clamp01(x));
const edgeFade = (x: number) =>
  Math.min(
    THREE.MathUtils.smoothstep(x, 0.18, 0.24),
    THREE.MathUtils.smoothstep(1 - x, 0.18, 0.24),
  );

type Spring = { value: number; velocity: number };
const newSpring = (): Spring => ({ value: 0, velocity: 0 });
const SPRING_DAMP = 9;
const stepSpring = (s: Spring, target: number, stiff: number, dt: number) => {
  s.velocity += ((target - s.value) * stiff - s.velocity * SPRING_DAMP) * dt;
  s.value += s.velocity * dt;
  if (Math.abs(s.velocity) < 0.001 && Math.abs(target - s.value) < 0.001) { s.value = target; s.velocity = 0; }
};
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function FruitSlider() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const softRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coreRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hovered, setHovered] = useState<Product | null>(null);

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas) return;
    const wrap = root.querySelector<HTMLElement>("[data-fruit-slider-wrap]");
    if (!wrap) return;
    const plantLEl = root.querySelector<HTMLElement>(".fruit-slider__plant-left");
    const plantREl = root.querySelector<HTMLElement>(".fruit-slider__plant-right");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const D = products.length;
    root.classList.add("is-hydrated", "is-boot");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      root.classList.remove("is-boot", "is-hydrated");
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const hemi = new THREE.HemisphereLight(0xfff8ee, 0xcdb99c, 0.6);
    const key = new THREE.DirectionalLight(0xfff1de, 2.2); key.position.set(2.5, 4, 3);
    const fill = new THREE.DirectionalLight(0xffe9d2, 0.55); fill.position.set(-3, 1.5, 2);
    scene.add(hemi, key, fill);

    type Fruit = {
      group: THREE.Group; pivot: THREE.Group;
      appear: Spring; lift: Spring;
      spin: number; speed: Spring;
      dwellStart: number; enterTime: number;
      loaded: boolean;
      rect: { x: number; y: number; w: number; h: number };
      hovered: boolean;
      hBase: number; pose: number;
    };

    const fruits: Fruit[] = products.map((p) => {
      const group = new THREE.Group();
      const pivot = new THREE.Group();
      group.add(pivot);
      scene.add(group);
      return {
        group, pivot,
        appear: newSpring(), lift: newSpring(),
        spin: 0, speed: newSpring(),
        dwellStart: -1, enterTime: -1,
        loaded: false,
        rect: { x: 0, y: 0, w: 0, h: 0 },
        hovered: false,
        hBase: SIZE_BY_SLUG[p.slug] ?? 1,
        pose: POSE_BY_SLUG[p.slug] ?? 0,
      };
    });
    fruits.forEach((f) => { f.lift.value = LIFT_PX; });

    /* ---- 尺寸 / 相机 / 底图 cover 反解 ---- */
    let vw = 0, rootH = 0, N = 0, F = 0, j = 0, u = 0, h0 = 0;
    let imgW = 0, imgH = 0, dispW = 0, dispH = 0, offX = 0, offY = 0;
    let interacted = false;
    let target = 0, H = 0, vel = 0, lastInteract = -1;

    const computeBg = () => {
      if (!imgW || !imgH || !vw || !rootH) return;
      const s = Math.max(vw / imgW, rootH / imgH);   // cover
      dispW = imgW * s; dispH = imgH * s;
      offX = (vw - dispW) * 0.5;
      offY = (rootH - dispH) * (vw < MOBILE_BP ? BG_POS_Y_MOBILE : BG_POS_Y_DESKTOP);
      layoutPlants();
    };

    /* 植物层：底图坐标 → 屏幕 px（与 cover 裁切同步） */
    function layoutPlants() {
      if (!dispW || !dispH) return;
      if (plantLEl) {
        plantLEl.style.left = `${(PLANT_LEFT.fx * dispW + offX).toFixed(1)}px`;
        plantLEl.style.top = `${(PLANT_LEFT.fy * dispH + offY).toFixed(1)}px`;
        plantLEl.style.width = `${(PLANT_LEFT.fw * dispW).toFixed(1)}px`;
        plantLEl.style.maxWidth = "none";
      }
      if (plantREl) {
        /* 高度只取植物段 → 配合 object-fit:cover/top 裁掉自带木箱 */
        const fhPlants = PNG_RIGHT_PLANTS_FRAC * PNG_RIGHT_ASPECT * (dispW / dispH) * PLANT_RIGHT.fw;
        plantREl.style.left = `${(PLANT_RIGHT.fx * dispW + offX).toFixed(1)}px`;
        plantREl.style.top = `${(PLANT_RIGHT.fy * dispH + offY).toFixed(1)}px`;
        plantREl.style.width = `${(PLANT_RIGHT.fw * dispW).toFixed(1)}px`;
        plantREl.style.height = `${(fhPlants * dispH).toFixed(1)}px`;
        plantREl.style.maxWidth = "none";
      }
    }

    const bgImg = new Image();
    bgImg.onload = () => { imgW = bgImg.naturalWidth; imgH = bgImg.naturalHeight; computeBg(); };
    bgImg.src = "/assets/agrumea/hero-nature-bg.jpg";

    /** 屏幕 x 比例 → 台座面落地线 y(px) */
    const stageY = (xScreenFrac: number) => {
      if (!dispH) return (0.70 + 0.04 * Math.pow(Math.sin(Math.PI * clamp01(xScreenFrac)), 1.2)) * rootH;
      const fx = (xScreenFrac * vw - offX) / dispW;
      const t = clamp01((fx - STAGE_SPAN_X[0]) / (STAGE_SPAN_X[1] - STAGE_SPAN_X[0]));
      const fy = STAGE_FY_EDGE + (STAGE_FY_CENTER - STAGE_FY_EDGE) * Math.pow(Math.sin(Math.PI * t), 1.2);
      return fy * dispH + offY;
    };

    const measure = () => {
      vw = window.innerWidth; rootH = root.getBoundingClientRect().height;
      const xs = vw <= 480, sm = !xs && vw <= 1024;
      N = vw * (xs ? 0.62 : sm ? 0.45 : 0.262);
      u = N * 0.42;
      F = D * N; j = 2 * N;
      h0 = 2 * N + TRIO_LEFT * vw - u / 2;
      renderer.setSize(vw, rootH, false);
      camera.aspect = vw / rootH;
      const dist = (vw * PX2W) / (2 * Math.tan((FOV / 2) * (Math.PI / 180)) * camera.aspect);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      computeBg();
      if (!interacted) { target = H = h0; }
    };
    measure();

    const snapToTrio = () => {
      if (dragging) return;
      target = h0 + Math.round((target - h0) / N) * N;
    };

    const worldX = (xpx: number) => (xpx - vw / 2) * PX2W;
    const worldY = (ypx: number) => (rootH / 2 - ypx) * PX2W;
    const posOf = (i: number, r: number) => { let c = (i * N + u / 2 + r) % F; if (c < 0) c += F; return c - j; };

    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    let readyCount = 0, revealAt = -1, destroyed = false;

    const loadModel = async (idx: number) => {
      const gltf = await loader.loadAsync(products[idx].model);
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      obj.position.set(-center.x, -box.min.y, -center.z);
      const norm = new THREE.Group();
      norm.scale.setScalar(1 / Math.max(size.y, 1e-6));
      norm.add(obj);
      fruits[idx].pivot.add(norm);
      obj.traverse((ch) => {
        const m = ch as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = false;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mm) => { const sm = mm as THREE.MeshStandardMaterial; if (sm.envMapIntensity !== undefined) sm.envMapIntensity = 0.9; });
        }
      });
      fruits[idx].loaded = true;
      /* 首果就绪 → 直接开始入场（不再等待 splash） */
      if (++readyCount === 1) revealAt = performance.now() + ENTER_DELAY;
      if (readyCount === D) root.classList.add("is-webgl");
    };

    (async () => {
      for (let i = 0; i < D; i++) {
        try { await loadModel(i); } catch (e) { console.warn(`glb ${products[i].slug} failed`, e); }
      }
    })();

    /* ---- 交互 ---- */
    let dragging = false, dragId = -1, movedFar = false, suppressClick = false;
    let dragX = 0, downX = 0, dragVel = 0, dragTime = 0;
    let spinIdx = -1, spinLastX = 0, spinVel = 0;
    let pointerInside = false, mouseX = 0, mouseY = 0, hoverIdx = -1;
    let lastHoverSlug = "";
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;

    const hitTest = (cx: number, cy: number) => {
      const r = root.getBoundingClientRect();
      const x = cx - r.left, y = cy - r.top;
      for (let i = 0; i < D; i++) {
        if (!fruits[i].loaded) continue;
        const b = fruits[i].rect;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
      }
      return -1;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      interacted = true;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      target -= d * WHEEL_SPEED;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(snapToTrio, 160);
    };

    const onDown = (e: PointerEvent) => {
      suppressClick = false; movedFar = false; dragId = e.pointerId;
      downX = e.clientX; dragX = e.clientX; dragVel = 0; spinVel = 0;
      dragTime = e.timeStamp || performance.now();
      if (e.pointerType !== "mouse") {
        const hit = hitTest(e.clientX, e.clientY);
        if (hit >= 0) { spinIdx = hit; spinLastX = e.clientX; dragging = false; return; }
      }
      dragging = true;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return;
      const now = e.timeStamp || performance.now();
      if (spinIdx >= 0) {
        const dx = e.clientX - spinLastX; spinLastX = e.clientX;
        if (Math.abs(e.clientX - downX) > 6) { movedFar = true; suppressClick = true; }
        const a = fruits[spinIdx];
        a.spin += dx * TOUCH_SPIN_DEG;
        a.speed.value = 0; a.speed.velocity = 0;
        spinVel = spinVel * 0.7 + (dx / Math.max(1, now - dragTime)) * 0.3 * TOUCH_SPIN_DEG * 1000;
        dragTime = now; lastInteract = now;
        return;
      }
      if (!dragging) return;
      if (!movedFar) {
        if (Math.abs(e.clientX - downX) <= 6) return;
        try { wrap.setPointerCapture(e.pointerId); } catch { return; }
        movedFar = true; suppressClick = true; interacted = true;
        dragX = e.clientX; dragTime = now;
        return;
      }
      const dx = e.clientX - dragX;
      dragVel = dragVel * 0.72 + (dx / Math.max(1, now - dragTime)) * 0.28;
      dragX = e.clientX; dragTime = now;
      target += dx * DRAG_SPEED;
    };

    const onUp = (e: PointerEvent) => {
      if (dragId === -1 || e.pointerId !== dragId) return;
      if (spinIdx >= 0) {
        const a = fruits[spinIdx];
        a.speed.value = clamp(spinVel, -240, 240); a.speed.velocity = 0;
        spinIdx = -1; spinVel = 0; dragId = -1; movedFar = false;
        return;
      }
      if (movedFar) {
        try { wrap.releasePointerCapture(e.pointerId); } catch { /* noop */ }
        target += clamp(dragVel, -FLING_CLAMP, FLING_CLAMP) * DRAG_SPEED * FLING_SPEED;
        snapToTrio();
      }
      dragVel = 0; dragging = false; dragId = -1; movedFar = false;
    };

    const onClick = (e: MouseEvent) => {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
      if (hoverIdx >= 0 && fine.matches) { e.preventDefault(); window.location.href = `/dispensa/${products[hoverIdx].slug}`; }
    };

    const onRootMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerInside = true;
      const r = root.getBoundingClientRect();
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    };
    const onRootLeave = () => {
      pointerInside = false; hoverIdx = -1;
      fruits.forEach((f) => (f.hovered = false));
      if (lastHoverSlug !== "") { lastHoverSlug = ""; setHovered(null); }
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("click", onClick, true);
    root.addEventListener("pointermove", onRootMove, { passive: true });
    root.addEventListener("pointerleave", onRootLeave);
    window.addEventListener("resize", measure);

    let raf = 0, prev = performance.now();
    const frame = (now: number) => {
      if (destroyed) return;
      const dt = Math.min(1 / 30, Math.max(0, (now - prev) / 1000));
      prev = now;

      const oldH = H;
      H += (target - H) * (1 - Math.exp(-(dragging ? 11 : 2.3) * dt));
      if (Math.abs(target - H) < 0.05) H = target;
      vel = dt > 0 ? (H - oldH) / dt : 0;
      const speedAbs = Math.abs(vel);
      if (dragging || spinIdx >= 0 || speedAbs > 6) lastInteract = now;
      const idleZone = !dragging && spinIdx < 0 && speedAbs <= N * 1.4;

      hoverIdx = -1;
      if (pointerInside && !dragging && fine.matches) {
        for (let i = 0; i < D; i++) {
          if (!fruits[i].loaded) continue;
          const r = fruits[i].rect;
          if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) { hoverIdx = i; break; }
        }
      }
      wrap.style.cursor = dragging || spinIdx >= 0 ? "grabbing" : hoverIdx >= 0 ? "pointer" : "grab";

      const slug = hoverIdx >= 0 ? products[hoverIdx].slug : "";
      if (slug !== lastHoverSlug) {
        lastHoverSlug = slug;
        setHovered(hoverIdx >= 0 ? products[hoverIdx] : null);
      }

      const hBase = rootH * 0.32;
      fruits.forEach((a, i) => {
        a.hovered = hoverIdx === i;

        /* 悬停自转：停留 260ms 后慢转，移开回弹到 22.5° 网格 */
        const dwellOk = idleZone && a.hovered;
        if (!dwellOk) a.dwellStart = -1;
        else if (a.dwellStart < 0) a.dwellStart = now;
        const wantSpin = fine.matches && a.loaded && a.hovered && spinIdx < 0 && a.dwellStart >= 0 &&
          (a.enterTime > lastInteract || now - a.dwellStart >= 260);
        if (spinIdx !== i) stepSpring(a.speed, wantSpin ? SPIN_DPS : 0, SPIN_SPRING_STIFF, dt);
        a.spin += a.speed.value * dt;
        if (Math.abs(a.speed.value) < 1.5 && Math.abs(a.speed.velocity) < 2 && spinIdx !== i) {
          const nearest = Math.round(a.spin / 22.5) * 22.5;
          a.spin += (nearest - a.spin) * (1 - Math.exp(-REST_SNAP_K * dt));
        }

        /* 入场 / 台上台下升降 */
        stepSpring(a.appear, a.loaded && revealAt >= 0 ? 1 : 0, 80, dt);

        const q = posOf(i, H) / vw;
        const xFrac = clamp01(q);
        const gx = q * vw;
        const h = hBase * a.hBase * depthScale(xFrac) * (a.hovered ? HOVER_BOOST : 1);
        const gy = stageY(xFrac) + h * GROUND_SINK;
        const w = h * 0.72;

        a.rect = { x: gx - w / 2, y: gy - h, w, h };
        const fade = edgeFade(q < 0 || q > 1 ? -1 : xFrac) * (q >= -0.15 && q <= 1.15 ? 1 : 0);
        const onStage = fade > 0.3 && a.loaded;
        stepSpring(a.lift, onStage ? 0 : LIFT_PX, 100, dt);

        const g = a.group;
        g.visible = fade > 0.01 && a.loaded;

        const ap = clamp(a.appear.value, 0, 1);
        const pop = 0.7 + 0.3 * easeOutCubic(ap);
        const yOff = (a.lift.value + (1 - easeOutCubic(ap)) * LIFT_PX) * PX2W;
        g.position.set(worldX(gx), worldY(gy) + yOff, 0);
        g.scale.set(h * PX2W * pop * fade, h * PX2W * pop * fade, h * PX2W * pop * fade);
        g.rotation.z = a.pose;
        a.pivot.rotation.y = THREE.MathUtils.degToRad(a.spin);
        a.pivot.visible = a.appear.value > 0.02;

        /* DOM 接触阴影：随落座同步显现，旋转时稳定不转 */
        const land = 1 - clamp01((a.lift.value + (1 - ap) * LIFT_PX) / LIFT_PX);
        const shOp = fade * ap * land;
        const softEl = softRefs.current[i];
        const coreEl = coreRefs.current[i];
        if (softEl) {
          softEl.style.opacity = (SH_SOFT.op * shOp).toFixed(3);
          softEl.style.transform =
            `translate3d(${(gx + w * SH_SOFT.dx).toFixed(1)}px, ${(gy + w * SH_SOFT.dy).toFixed(1)}px, 0) ` +
            `scale(${((w * SH_SOFT.sw) / 200 * pop).toFixed(3)}, ${((w * SH_SOFT.sh) / 60 * pop).toFixed(3)})`;
        }
        if (coreEl) {
          coreEl.style.opacity = (SH_CORE.op * shOp).toFixed(3);
          coreEl.style.transform =
            `translate3d(${(gx + w * SH_CORE.dx).toFixed(1)}px, ${(gy + w * SH_CORE.dy).toFixed(1)}px, 0) ` +
            `scale(${((w * SH_CORE.sw) / 120 * pop).toFixed(3)}, ${((w * SH_CORE.sh) / 30 * pop).toFixed(3)})`;
        }
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const hitWatch = setInterval(() => {
      fruits.forEach((a) => {
        if (a.hovered && a.enterTime < 0) a.enterTime = performance.now();
        if (!a.hovered) a.enterTime = -1;
      });
    }, 120);

    return () => {
      destroyed = true;
      clearInterval(hitWatch);
      clearTimeout(wheelTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("click", onClick, true);
      root.removeEventListener("pointermove", onRootMove);
      root.removeEventListener("pointerleave", onRootLeave);
      fruits.forEach((f) => {
        f.pivot.traverse((ch) => {
          const m = ch as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mm) => {
              const sm = mm as THREE.MeshStandardMaterial;
              Object.values(sm).forEach((v) => { if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose(); });
              sm.dispose();
            });
          }
        });
      });
      draco.dispose(); pmrem.dispose(); renderer.dispose();
    };
  }, []);

  const origin = hovered ? (hovered as Product & { origin?: string }).origin : undefined;

  return (
    <section
      className={`fruit-slider fruit-slider--nature${SHOW_PLANT_LAYERS ? "" : " no-plant-layers"}`}
      ref={rootRef}
      data-fruit-slider
      data-anim="hero"
    >
      {/* 层 0：净版底图 */}
      <div className="fruit-slider__bg" aria-hidden="true" />
      {/* 层 1：棕榈叶影（漂移循环） */}
      <div className="fruit-slider__palm-shadow" aria-hidden="true" />
      {/* 层 2：植物（JS cover 映射定位 + 轻摆循环） */}
      <img className="fruit-slider__plant-left" src="/assets/agrumea/plant-left.png" alt="" aria-hidden="true" />
      <img className="fruit-slider__plant-right" src="/assets/agrumea/plant-right.png" alt="" aria-hidden="true" />
      {/* 层 4：品牌字标（页面加载即淡入） */}
      <img
        className="fruit-slider__brand"
        src="/assets/agrumea/brand-wordmark.svg"
        alt="AGRUMEA Farm — Pure fruits, natural goodness, from our farm"
      />
      {/* 接触阴影（multiply 印在台座） */}
      <div className="fruit-slider__shadows" aria-hidden="true">
        {products.map((p, i) => (
          <div key={`shadow-soft-${p.slug}`} className="fruit-shadow" ref={(el) => { softRefs.current[i] = el; }} />
        ))}
        {products.map((p, i) => (
          <div key={`shadow-core-${p.slug}`} className="fruit-shadow fruit-shadow--core" ref={(el) => { coreRefs.current[i] = el; }} />
        ))}
      </div>
      {/* 层 3：WebGL 水果 */}
      <canvas ref={canvasRef} className="fruit-slider__canvas" aria-hidden="true" />
      {/* 层 6：悬停信息卡片 */}
      <div className={`fruit-info-card${hovered ? " is-visible" : ""}`} aria-live="polite">
        {hovered && (
          <>
            <h2 className="fruit-info-card__name">{hovered.name}</h2>
            {origin ? <p className="fruit-info-card__origin">{origin}</p> : null}
            <p className="fruit-info-card__desc">{hovered.description}</p>
          </>
        )}
      </div>
      <p className="fruit-slider__prompt">Scroll to discover</p>
      {/* 交互层 */}
      <div className="fruit-slider__wrapper" data-fruit-slider-wrap>
        <div className="fruit-slider__marquee">
          <div className="fruit-slider__track" data-fruit-slider-track>
            {products.map((p, i) => (
              <a
                key={p.slug}
                className="fruit-slider__item"
                href={`/dispensa/${p.slug}`}
                aria-label={`${p.fruit} — ${p.name}`}
                data-fruit-slider-item
                data-fruit={p.image}
                tabIndex={-1}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="fruit-slider__base"
                  src={p.turns[0]}
                  alt={p.fruit}
                  width={900}
                  height={1440}
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}