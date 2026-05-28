"use client";

import { memo, useEffect, useRef, useState } from "react";

const MIN_BLINK_GAP_MS = 5000;
const MAX_BLINK_GAP_MS = 15000;
const BLINK_DURATION_MS = 140;
const INTRO_WAVE_DURATION_MS = 2200;
const INTRO_WAVE_DELAY_MS = 350;
const ARM_SETTLE_DURATION_MS = 420;
const LEFT_ARM_RAISE_DURATION_MS = 720;
const LEFT_ARM_RAISE_LEAD_MS = 260;
const FX_STARS_AURA_DURATION_MS = 12000;
const FX_DOTS_AURA_DURATION_MS = 14000;
const RIGHT_ARM_WAVE_PATH = "M 310 235 q 38 -10 50 -50";
const RIGHT_ARM_REST_PATH = "M 310 235 q 26 22 30 74";
const RIGHT_HAND_WAVE_TRANSFORM = "translate(362, 178)";
const RIGHT_HAND_REST_TRANSFORM = "translate(338, 300) rotate(18)";
const LEFT_ARM_DOWN_PATH = "M 90 235 q -18 20 -14 78";
const LEFT_ARM_POINT_PATH = "M 90 235 q -28 -26 -10 -64";
const LEFT_HAND_DOWN_TRANSFORM = "translate(74, 300) rotate(-22)";
const LEFT_HAND_POINT_TRANSFORM = "translate(80, 166) rotate(-6)";

interface QuadPath {
  moveX: number;
  moveY: number;
  curveX: number;
  curveY: number;
  deltaX: number;
  deltaY: number;
}

function parseQuadPath(path: string): QuadPath | null {
  const match = path.match(
    /^M\s*(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)\s*q\s*(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    moveX: Number(match[1]),
    moveY: Number(match[2]),
    curveX: Number(match[3]),
    curveY: Number(match[4]),
    deltaX: Number(match[5]),
    deltaY: Number(match[6]),
  };
}

function formatQuadPath(path: QuadPath): string {
  return `M ${path.moveX.toFixed(3)} ${path.moveY.toFixed(3)} q ${path.curveX.toFixed(3)} ${path.curveY.toFixed(3)} ${path.deltaX.toFixed(3)} ${path.deltaY.toFixed(3)}`;
}

function interpolateQuadPath(fromPath: QuadPath, toPath: QuadPath, progress: number): QuadPath {
  const lerp = (from: number, to: number) => from + (to - from) * progress;

  return {
    moveX: lerp(fromPath.moveX, toPath.moveX),
    moveY: lerp(fromPath.moveY, toPath.moveY),
    curveX: lerp(fromPath.curveX, toPath.curveX),
    curveY: lerp(fromPath.curveY, toPath.curveY),
    deltaX: lerp(fromPath.deltaX, toPath.deltaX),
    deltaY: lerp(fromPath.deltaY, toPath.deltaY),
  };
}

function getRandomBlinkDelay(): number {
  return Math.floor(Math.random() * (MAX_BLINK_GAP_MS - MIN_BLINK_GAP_MS + 1)) + MIN_BLINK_GAP_MS;
}

function AnimatedPennyMascotInner() {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSvg() {
      const response = await fetch("/images/learning-bank-mascot-penny.svg");
      if (!response.ok) {
        return;
      }

      const svgText = await response.text();
      if (isActive) {
        setSvgMarkup(svgText);
      }
    }

    void loadSvg();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!svgMarkup || !containerRef.current) {
      return;
    }

    const host = containerRef.current;
    const svgRoot = host.querySelector<SVGSVGElement>("svg");
    const leftEye = host.querySelector<SVGGElement>("#layer-left-eye");
    const rightEye = host.querySelector<SVGGElement>("#layer-right-eye");
    const leftArm = host.querySelector<SVGGElement>("#layer-left-arm");
    const leftArmPath = host.querySelector<SVGPathElement>("#layer-left-arm > path");
    const leftHand = host.querySelector<SVGGElement>("#layer-left-arm > g");
    const fxStars = host.querySelector<SVGGElement>("#layer-fx-stars");
    const fxDots = host.querySelector<SVGGElement>("#layer-fx-dots");
    const rightArm = host.querySelector<SVGGElement>("#layer-right-arm");
    const rightArmPath = host.querySelector<SVGPathElement>("#layer-right-arm > path");
    const rightHand = host.querySelector<SVGGElement>("#layer-right-arm > g");
    const rightArmMotionLines = host.querySelector<SVGGElement>("#layer-fx-motion-lines");

    if (!leftEye || !rightEye) {
      return;
    }

    if (svgRoot) {
      // Allow animated limbs to extend beyond the SVG viewport when needed.
      svgRoot.style.overflow = "visible";
      svgRoot.style.display = "block";
      svgRoot.style.width = "100%";
      svgRoot.style.height = "100%";
    }

    const eyes = [leftEye, rightEye];
    for (const eye of eyes) {
      eye.style.transformBox = "fill-box";
      eye.style.transformOrigin = "center";
      eye.style.transition = "transform 90ms ease";
      eye.style.willChange = "transform";
    }

    let blinkTimeoutId: number | null = null;
    let unblinkTimeoutId: number | null = null;
    let rightArmAnimation: Animation | null = null;
    let settleRightArmTimeoutId: number | null = null;
    let finalizeRightArmTimeoutId: number | null = null;
    let rightHandSettleAnimation: Animation | null = null;
    let raiseLeftArmTimeoutId: number | null = null;
    let finalizeLeftArmTimeoutId: number | null = null;
    let leftHandRaiseAnimation: Animation | null = null;
    let fxAuraRafId: number | null = null;
    let leftArmPathRafId: number | null = null;
    let rightArmPathRafId: number | null = null;

    if (fxStars || fxDots) {
      const auraStart = performance.now();

      const stepAura = (timestamp: number) => {
        const elapsedStars = (timestamp - auraStart) / FX_STARS_AURA_DURATION_MS;
        const elapsedDots = (timestamp - auraStart) / FX_DOTS_AURA_DURATION_MS;

        if (fxStars) {
          const starPhase = elapsedStars * Math.PI * 2;
          const starX = Math.sin(starPhase) * 3.2;
          const starY = Math.cos(starPhase * 0.82) * 4.4;
          const starRotate = Math.sin(starPhase * 0.65) * 4.5;
          const starScale = 1 + Math.sin(starPhase * 1.2) * 0.045;
          const starOpacity = 0.84 + Math.cos(starPhase * 0.9) * 0.06;

          fxStars.style.transformBox = "view-box";
          fxStars.style.transformOrigin = "center";
          fxStars.style.transform = `translate(${starX.toFixed(2)}px, ${starY.toFixed(2)}px) rotate(${starRotate.toFixed(2)}deg) scale(${starScale.toFixed(3)})`;
          fxStars.style.opacity = starOpacity.toFixed(3);
        }

        if (fxDots) {
          const dotPhase = elapsedDots * Math.PI * 2;
          const dotX = Math.cos(dotPhase * 0.9) * 3.8;
          const dotY = Math.sin(dotPhase * 1.15) * 2.8;
          const dotRotate = Math.sin(dotPhase * 0.7) * 3.2;
          const dotScale = 1 + Math.cos(dotPhase * 1.05) * 0.04;
          const dotOpacity = 0.74 + Math.sin(dotPhase * 1.1) * 0.055;

          fxDots.style.transformBox = "view-box";
          fxDots.style.transformOrigin = "center";
          fxDots.style.transform = `translate(${dotX.toFixed(2)}px, ${dotY.toFixed(2)}px) rotate(${dotRotate.toFixed(2)}deg) scale(${dotScale.toFixed(3)})`;
          fxDots.style.opacity = dotOpacity.toFixed(3);
        }

        fxAuraRafId = window.requestAnimationFrame(stepAura);
      };

      fxAuraRafId = window.requestAnimationFrame(stepAura);
    }

    if (leftArm) {
      leftArm.style.transform = "none";
      if (leftArmPath) {
        leftArmPath.setAttribute("d", LEFT_ARM_DOWN_PATH);
      }
      if (leftHand) {
        leftHand.setAttribute("transform", LEFT_HAND_DOWN_TRANSFORM);
      }

      raiseLeftArmTimeoutId = window.setTimeout(() => {
        if (leftArmPath) {
          const fromPath = parseQuadPath(LEFT_ARM_DOWN_PATH);
          const toPath = parseQuadPath(LEFT_ARM_POINT_PATH);

          if (fromPath && toPath) {
            const pathStart = performance.now();
            const stepLeftPath = (timestamp: number) => {
              const progress = Math.min(1, (timestamp - pathStart) / LEFT_ARM_RAISE_DURATION_MS);
              const eased = 1 - Math.pow(1 - progress, 3);
              leftArmPath.setAttribute("d", formatQuadPath(interpolateQuadPath(fromPath, toPath, eased)));

              if (progress < 1) {
                leftArmPathRafId = window.requestAnimationFrame(stepLeftPath);
              }
            };

            leftArmPathRafId = window.requestAnimationFrame(stepLeftPath);
          }
        }

        if (leftHand) {
          leftHandRaiseAnimation = leftHand.animate(
            [
              { transform: "translate(74px, 300px) rotate(-22deg)" },
              { transform: "translate(80px, 166px) rotate(-6deg)" },
            ],
            {
              duration: LEFT_ARM_RAISE_DURATION_MS,
              easing: "ease-in-out",
              fill: "forwards",
            },
          );
        }

        finalizeLeftArmTimeoutId = window.setTimeout(() => {
          if (leftArmPath) {
            leftArmPath.setAttribute("d", LEFT_ARM_POINT_PATH);
          }
          if (leftHand) {
            leftHand.setAttribute("transform", LEFT_HAND_POINT_TRANSFORM);
          }
        }, LEFT_ARM_RAISE_DURATION_MS);
      }, INTRO_WAVE_DELAY_MS + INTRO_WAVE_DURATION_MS - LEFT_ARM_RAISE_LEAD_MS);
    }

    if (rightArm) {
      // Anchor rotation to the shoulder joint where the arm meets the body.
      rightArm.style.transformBox = "view-box";
      rightArm.style.transformOrigin = "310px 235px";

      if (rightArmPath) {
        rightArmPath.setAttribute("d", RIGHT_ARM_WAVE_PATH);
      }

      if (rightHand) {
        rightHand.setAttribute("transform", RIGHT_HAND_WAVE_TRANSFORM);
      }

      if (rightArmMotionLines) {
        rightArmMotionLines.style.opacity = "0.7";
      }

      // Intro gesture: wave twice, then settle with the arm lowered by her side.
      rightArmAnimation = rightArm.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-14deg)", offset: 0.18 },
          { transform: "rotate(12deg)", offset: 0.36 },
          { transform: "rotate(-14deg)", offset: 0.54 },
          { transform: "rotate(12deg)", offset: 0.72 },
          { transform: "rotate(0deg)", offset: 1 },
        ],
        {
          duration: INTRO_WAVE_DURATION_MS,
          delay: INTRO_WAVE_DELAY_MS,
          easing: "ease-in-out",
          fill: "forwards",
        },
      );

      settleRightArmTimeoutId = window.setTimeout(() => {
        rightArm.style.transform = "none";

        if (rightArmPath) {
          const fromPath = parseQuadPath(RIGHT_ARM_WAVE_PATH);
          const toPath = parseQuadPath(RIGHT_ARM_REST_PATH);

          if (fromPath && toPath) {
            const pathStart = performance.now();
            const stepRightPath = (timestamp: number) => {
              const progress = Math.min(1, (timestamp - pathStart) / ARM_SETTLE_DURATION_MS);
              const eased = 1 - Math.pow(1 - progress, 3);
              rightArmPath.setAttribute("d", formatQuadPath(interpolateQuadPath(fromPath, toPath, eased)));

              if (progress < 1) {
                rightArmPathRafId = window.requestAnimationFrame(stepRightPath);
              }
            };

            rightArmPathRafId = window.requestAnimationFrame(stepRightPath);
          }
        }

        if (rightHand) {
          rightHandSettleAnimation = rightHand.animate(
            [
              { transform: "translate(362px, 178px) rotate(0deg)" },
              { transform: "translate(338px, 300px) rotate(18deg)" },
            ],
            {
              duration: ARM_SETTLE_DURATION_MS,
              easing: "ease-out",
              fill: "forwards",
            },
          );
        }

        if (rightArmMotionLines) {
          rightArmMotionLines.animate([{ opacity: 0.7 }, { opacity: 0 }], {
            duration: ARM_SETTLE_DURATION_MS,
            easing: "ease-out",
            fill: "forwards",
          });
        }

        finalizeRightArmTimeoutId = window.setTimeout(() => {
          if (rightArmPath) {
            rightArmPath.setAttribute("d", RIGHT_ARM_REST_PATH);
          }
          if (rightHand) {
            rightHand.setAttribute("transform", RIGHT_HAND_REST_TRANSFORM);
          }
          if (rightArmMotionLines) {
            rightArmMotionLines.style.opacity = "0";
          }
        }, ARM_SETTLE_DURATION_MS);
      }, INTRO_WAVE_DELAY_MS + INTRO_WAVE_DURATION_MS);
    }

    const queueBlink = () => {
      blinkTimeoutId = window.setTimeout(() => {
        for (const eye of eyes) {
          eye.style.transform = "scaleY(0.08)";
        }

        unblinkTimeoutId = window.setTimeout(() => {
          for (const eye of eyes) {
            eye.style.transform = "scaleY(1)";
          }

          queueBlink();
        }, BLINK_DURATION_MS);
      }, getRandomBlinkDelay());
    };

    queueBlink();

    return () => {
      if (blinkTimeoutId !== null) {
        window.clearTimeout(blinkTimeoutId);
      }
      if (unblinkTimeoutId !== null) {
        window.clearTimeout(unblinkTimeoutId);
      }
      if (settleRightArmTimeoutId !== null) {
        window.clearTimeout(settleRightArmTimeoutId);
      }
      if (finalizeRightArmTimeoutId !== null) {
        window.clearTimeout(finalizeRightArmTimeoutId);
      }
      if (raiseLeftArmTimeoutId !== null) {
        window.clearTimeout(raiseLeftArmTimeoutId);
      }
      if (finalizeLeftArmTimeoutId !== null) {
        window.clearTimeout(finalizeLeftArmTimeoutId);
      }
      rightArmAnimation?.cancel();
      rightHandSettleAnimation?.cancel();
      leftHandRaiseAnimation?.cancel();
      if (fxAuraRafId !== null) {
        window.cancelAnimationFrame(fxAuraRafId);
      }
      if (leftArmPathRafId !== null) {
        window.cancelAnimationFrame(leftArmPathRafId);
      }
      if (rightArmPathRafId !== null) {
        window.cancelAnimationFrame(rightArmPathRafId);
      }
    };
  }, [svgMarkup]);

  return (
    <div
      ref={containerRef}
      className="relative z-10 mt-28 ml-auto h-[22rem] w-[22rem] overflow-visible drop-shadow-[0_18px_30px_rgba(14,15,12,0.18)] sm:mt-24 sm:h-[24rem] sm:w-[24rem] lg:mt-20 lg:h-[26rem] lg:w-[26rem]"
      aria-label="Penny the mascot"
      role="img"
      dangerouslySetInnerHTML={svgMarkup ? { __html: svgMarkup } : undefined}
    />
  );
}

export const AnimatedPennyMascot = memo(AnimatedPennyMascotInner);
