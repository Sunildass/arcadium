export type ArcadiumTheme = {
  id: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scoreFont?: string;
  };
  effects: {
    glow?: boolean;
    scanlines?: boolean;
    pixelBorders?: boolean;
    neonShadows?: boolean;
    grainOverlay?: boolean;
  };
  backgroundStyle: {
    gradient?: string;
    image?: string;
    animated?: boolean;
  };
};
