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
          opacity: 0,
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
          opacity: 0,
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
      context.revert();
    };
  }, []);

  return rootRef;
};

export default useLandingMotion;
