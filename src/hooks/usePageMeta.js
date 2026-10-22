import { useEffect } from "react";

export const SITE_URL = "https://bubbles-zeta-nine.vercel.app";

export const DEFAULT_TITLE = "Bubbles | Chat, Calls & AI in One Place";

export const DEFAULT_DESCRIPTION =
  "Bubbles is a real-time chat app for one-to-one and group conversations, voice messages, calls, file sharing, and AI-assisted replies.";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    document.head.appendChild(element);

    return () => element.remove();
  }

  const previous = {};

  Object.entries(attributes).forEach(([key, value]) => {
    previous[key] = element.getAttribute(key);
    element.setAttribute(key, value);
  });

  return () => {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    });
  };
};

const upsertCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  const previous = element.getAttribute("href");
  element.setAttribute("href", href);

  return () => {
    if (previous === null) {
      element.remove();
    } else {
      element.setAttribute("href", previous);
    }
  };
};

export default function usePageMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
} = {}) {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = title;

    const cleanups = [
      upsertMeta('meta[name="description"]', {
        name: "description",
        content: description,
      }),
      upsertMeta('meta[property="og:title"]', {
        property: "og:title",
        content: title,
      }),
      upsertMeta('meta[property="og:description"]', {
        property: "og:description",
        content: description,
      }),
      upsertMeta('meta[property="og:url"]', {
        property: "og:url",
        content: `${SITE_URL}${path}`,
      }),
      upsertMeta('meta[name="twitter:title"]', {
        name: "twitter:title",
        content: title,
      }),
      upsertMeta('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: description,
      }),
      upsertCanonical(`${SITE_URL}${path}`),
    ];

    return () => {
      document.title = previousTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [title, description, path]);
}
