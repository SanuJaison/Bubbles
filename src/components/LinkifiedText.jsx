import { Fragment } from "react";

const LINK_PATTERN =
  /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|((?:https?:\/\/|www\.)[^\s<]+)/gi;

const TRAILING_PUNCTUATION = /[.,!?;:)\]}'">]+$/;

const splitTrailingPunctuation = (value) => {
  const match = value.match(TRAILING_PUNCTUATION);

  if (!match) {
    return [value, ""];
  }

  return [value.slice(0, -match[0].length), match[0]];
};

const withProtocol = (value) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

const LinkifiedText = ({ text, linkClassName = "" }) => {
  const value = String(text || "");
  const nodes = [];
  const pattern = new RegExp(LINK_PATTERN.source, "gi");
  let lastIndex = 0;
  let key = 0;
  let match;

  while ((match = pattern.exec(value)) !== null) {
    const [raw, markdown, label, markdownUrl, rawUrl] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(value.slice(lastIndex, start));
    }

    if (markdown) {
      nodes.push(
        <a
          key={`link-${key++}`}
          href={markdownUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          onClick={(event) => event.stopPropagation()}
        >
          {label}
        </a>,
      );
    } else {
      const [url, trailing] = splitTrailingPunctuation(rawUrl);

      if (url) {
        nodes.push(
          <a
            key={`link-${key++}`}
            href={withProtocol(url)}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
            onClick={(event) => event.stopPropagation()}
          >
            {url}
          </a>,
        );

        if (trailing) {
          nodes.push(trailing);
        }
      }
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return <Fragment>{nodes}</Fragment>;
};

export default LinkifiedText;
