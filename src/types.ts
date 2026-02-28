export interface FaceParams {
  faceShape: number;    // 0-4
  skinColor: string;
  eyeStyle: number;     // 0-5
  eyeColor: string;
  pupilSize: number;    // 0.55-0.85
  eyebrowStyle: number; // 0-4
  mouthStyle: number;   // 0-5
  noseStyle: number;    // 0-3
  hasCheeks: boolean;
  cheekColor: string;
  animDelay: number;    // 0-1 fraction for phase offset
}

export interface FacegenOptions {
  size?: number;
  animate?: boolean;
}

export interface FacegenProps {
  seed: string;
  size?: number;
  animate?: boolean;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}
