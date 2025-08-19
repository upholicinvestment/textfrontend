import React from "react";

type CSSProps = React.CSSProperties & {
  WebkitBackgroundClip?: string;
  WebkitTextFillColor?: string;
};

const containerStyle: React.CSSProperties = {
  position: "absolute",
  top: "14%",
  right: "3%",
  width: "42vw",
  maxWidth: 680,
  minWidth: 320,
  zIndex: 3,
  color: "#eaeaea",
  pointerEvents: "auto",
  fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  opacity: 0, // start hidden
  animation: "fadeInRightPanel 1s ease-out 2s forwards", // fade in after 2s
};

const tagStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  letterSpacing: "0.18em",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 18,
  color: "#6fa9ff",
  textTransform: "uppercase",
};

const headingStyle: CSSProps = {
  margin: 0,
  lineHeight: 1.05,
  fontWeight: 700,
  fontFamily: "Space Grotesk, Inter, sans-serif",
  fontSize: "clamp(36px, 4.6vw, 72px)",
  letterSpacing: "0.02em",
  backgroundImage:
    "linear-gradient(90deg, #ffffff, #eaeaea 30%, #b9c6ff 65%, #ffffff)",
  backgroundSize: "300%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  animation: "heroShimmer 12s linear infinite",
};

const paragraphStyle: React.CSSProperties = {
  marginTop: 22,
  marginBottom: 28,
  lineHeight: 1.75,
  fontSize: "clamp(15px, 1.15vw, 18px)",
  letterSpacing: "0.01em",
  color: "rgba(234,234,234,0.88)",
  maxWidth: 720,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
  fontWeight: 600,
  fontSize: "clamp(12px, 0.95vw, 14px)",
  color: "rgba(234,234,234,0.9)",
};

const RightPanel: React.FC = () => {
  return (
    <div style={containerStyle}>
      <div style={tagStyle}>UpholicTech</div>

      <h1 style={headingStyle}>WE BUILD SYSTEMS WHERE AI MEETS ROI.</h1>

      <p style={paragraphStyle}>
        Algorithmic trading uses computer programs to execute trades automatically
        based on predefined rules. It removes emotional bias and reacts to market
        changes in milliseconds. Strategies can range from simple moving average
        crossovers to complex AI-driven models. The goal is to maximize returns
        while controlling risk and slippage.
        Credits:-3D model “Pack Money (Pilha de Dinheiro)” by Caio de Oliveira (Sketchfab: @caiodeoliveira), licensed under CC BY 4.0.
        3D model “Cash Pile and Money Stacks” by streetpharmacy (Sketchfab: @streetpharmacy), licensed under CC BY 4.0.
      </p>

      <div style={gridStyle}>{/* (reserved for future cards/stats) */}</div>

      <style>
        {`
          @keyframes heroShimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 300% 50%; }
          }

          @keyframes fadeInRightPanel {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default RightPanel;