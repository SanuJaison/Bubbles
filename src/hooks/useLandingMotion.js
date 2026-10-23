import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useLandingMotion = () => {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    let disposed = false;
    const listeners = [];

    const context = gsap.context(() => {
      const heroItems = gsap.utils.toArray("[data-hero]");

      if (heroItems.length > 0) {
        gsap.from(heroItems, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.09,
          clearProps: "transform,opacity",
        });
      }

      const heroVisual = root.querySelector("[data-hero-visual]");

      if (heroVisual) {
        gsap.from(heroVisual, {
          opacity: 0,
          y: 32,
          scale: 0.97,
          duration: 1,
          delay: 0.18,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
      }

      gsap.utils.toArray("[data-reveal]").forEach((item) => {
        gsap.from(item, {
          opacity: 0.72,
          y: 22,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 88%",
            once: true,
          },
          clearProps: "transform,opacity",
        });
      });

      gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
        gsap.from(Array.from(group.children), {
          opacity: 0.72,
          y: 22,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: group,
            start: "top 85%",
            once: true,
          },
          clearProps: "transform,opacity",
        });
      });

      gsap.utils.toArray("[data-float]").forEach((item, index) => {
        gsap.to(item, {
          y: index % 2 === 0 ? -6 : -4,
          duration: 2.8 + index * 0.35,
          delay: 0.8 + index * 0.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      gsap.utils.toArray("[data-blob]").forEach((blob, index) => {
        gsap.to(blob, {
          x: index % 2 === 0 ? 18 : -14,
          y: index % 2 === 0 ? -10 : 12,
          duration: 9 + index * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      const orbs = gsap.utils.toArray("[data-orb]");
      const aura = root.querySelector("[data-cursor-aura]");
      const finePointer = window.matchMedia("(pointer: fine)").matches;

      orbs.forEach((orb, index) => {
        gsap.to(orb, {
          scale: 1.06 + index * 0.02,
          duration: 8 + index * 2,
          delay: index * 0.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      if (finePointer) {
        const orbFollowers = orbs.map((orb) => ({
          moveX: gsap.quickTo(orb, "x", {
            duration: 1.1,
            ease: "power3.out",
          }),
          moveY: gsap.quickTo(orb, "y", {
            duration: 1.1,
            ease: "power3.out",
          }),
          depth: Number(orb.dataset.depth || 24),
        }));

        const auraX = aura
          ? gsap.quickTo(aura, "x", {
              duration: 0.7,
              ease: "power3.out",
            })
          : null;
        const auraY = aura
          ? gsap.quickTo(aura, "y", {
              duration: 0.7,
              ease: "power3.out",
            })
          : null;

        let auraVisible = false;

        const handleWindowPointerMove = (event) => {
          const x = event.clientX / window.innerWidth - 0.5;
          const y = event.clientY / window.innerHeight - 0.5;

          orbFollowers.forEach(({ moveX, moveY, depth }) => {
            moveX(x * depth);
            moveY(y * depth);
          });

          if (auraX && auraY) {
            auraX(event.clientX);
            auraY(event.clientY);

            if (!auraVisible) {
              auraVisible = true;
              gsap.to(aura, { opacity: 1, duration: 0.5 });
            }
          }
        };

        window.addEventListener("pointermove", handleWindowPointerMove);
        listeners.push(() =>
          window.removeEventListener("pointermove", handleWindowPointerMove),
        );
      }

      const tiltArea = root.querySelector("[data-hero-visual]");
      const tiltTarget = root.querySelector("[data-tilt]");

      if (tiltArea && tiltTarget && finePointer) {
        gsap.set(tiltTarget, {
          transformPerspective: 1200,
          transformOrigin: "center center",
        });

        const rotateX = gsap.quickTo(tiltTarget, "rotationX", {
          duration: 0.8,
          ease: "power3.out",
        });
        const rotateY = gsap.quickTo(tiltTarget, "rotationY", {
          duration: 0.8,
          ease: "power3.out",
        });

        const handlePointerMove = (event) => {
          const bounds = tiltArea.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;

          rotateY(x * 7);
          rotateX(-y * 7);
        };

        const handlePointerLeave = () => {
          rotateX(0);
          rotateY(0);
        };

        tiltArea.addEventListener("pointermove", handlePointerMove);
        tiltArea.addEventListener("pointerleave", handlePointerLeave);

        listeners.push(() => {
          tiltArea.removeEventListener("pointermove", handlePointerMove);
          tiltArea.removeEventListener("pointerleave", handlePointerLeave);
        });
      }
    }, root);

    const refresh = () => {
      if (!disposed) {
        ScrollTrigger.refresh();
      }
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    window.addEventListener("load", refresh);

    return () => {
      disposed = true;
      window.removeEventListener("load", refresh);
      listeners.forEach((removeListener) => removeListener());
      context.revert();
    };
  }, []);

  return rootRef;
};

export default useLandingMotion;
