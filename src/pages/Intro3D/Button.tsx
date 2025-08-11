import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  href?: string;
  text?: string;
}

const Button: React.FC<ButtonProps> = ({
  href = '/',
  text = 'Explore the algo world 🚀',
}) => {
  return (
    <StyledButton href={href}>
      <div className="track">
        {/* repeat so the scroll loops seamlessly */}
        <span className="loop">
          {text} &nbsp;•&nbsp; {text} &nbsp;•&nbsp; {text}
        </span>
      </div>
    </StyledButton>
  );
};

const StyledButton = styled.a`
  position: relative;
  display: inline-block;
  text-decoration: none;

  /* 🔲 pill + border */
  border: 2px solid #fff;
  border-radius: 999px;
  padding: 0.95rem 3.75rem;
  background: #000;
  color: #fff;
  line-height: 1;
  font-weight: 900;
  font-family: 'Caviar-Dreams', monospace;
  text-transform: uppercase;

  /* single line + overflow hide */
  white-space: nowrap;
  overflow: hidden;

  /* viewport for marquee */
  .track {
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

  /* scrolling text */
  .loop {
    display: inline-block;
    padding-left: 100%;
    animation: button-scroll 8s linear infinite;
    letter-spacing: 0.04em;
  }

  @keyframes button-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }
`;

export default Button;
