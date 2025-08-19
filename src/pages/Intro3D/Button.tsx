import React from "react";

export interface ButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Visible label (also used if marqueeText is not provided) */
  text?: string;
  /** Optional separate marquee content; falls back to `text` */
  marqueeText?: string;
  /** Disable scrolling if false */
  alwaysScroll?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  href = "/",
  text = "Explore the algo world 🚀",
  marqueeText,
  alwaysScroll = true,
  className,
  ...rest
}) => {
  const content = marqueeText ?? text;

  return (
    <a
      href={href}
      className={`ut-marquee-btn ${className ?? ""}`}
      data-scroll={alwaysScroll ? "on" : "off"}
      {...rest}
    >
      <div className="track">
        <span className="loop">
          {content} &nbsp;•&nbsp; {content} &nbsp;•&nbsp; {content}
        </span>
      </div>

      {/* Local CSS (scoped by the ut-marquee-btn class) */}
      <style>
        {`
        .ut-marquee-btn {
          position: relative;
          display: inline-block;
          text-decoration: none;

          border: 2px solid #fff;
          border-radius: 999px;
          padding: 0.95rem 3.75rem;
          background: #000;
          color: #fff;
          line-height: 1;
          font-weight: 900;
          font-family: 'Caviar-Dreams', monospace;
          text-transform: uppercase;

          white-space: nowrap;
          overflow: hidden;
        }

        .ut-marquee-btn .track {
          position: relative;
          display: block;
          width: 100%;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 10%,
            #000 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 10%,
            #000 90%,
            transparent 100%
          );
        }

        .ut-marquee-btn .loop {
          display: inline-block;
          padding-left: 100%;
          letter-spacing: 0.04em;
          animation: ut-button-scroll 8s linear infinite;
        }

        /* Turn off animation when data-scroll="off" */
        .ut-marquee-btn[data-scroll="off"] .loop {
          animation: none;
          transform: translateX(0);
          padding-left: 0;
        }

        @keyframes ut-button-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}
      </style>
    </a>
  );
};

export default Button;