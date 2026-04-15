declare module "react-globe.gl" {
  import { ComponentType } from "react";

  type GlobePoint = {
    lat: number;
    lng: number;
    altitude?: number;
  };

  export type GlobeMethods = {
    pointOfView: (point: GlobePoint, transitionMs?: number) => void;
  };

  const Globe: ComponentType<Record<string, unknown>>;
  export default Globe;
}
