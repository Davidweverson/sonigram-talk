import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?"'\])>])/g;

export function linkifyContent(text: string): React.ReactNode {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
