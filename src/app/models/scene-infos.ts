import Color from "./color";
import Light from "./light";
import Material from "./material";
import Sphere from "./sphere";

export default interface SceneInfos {
    spheres: Sphere[];
    materials: Material[];
    groundColor: Color;
    light: Light[];
    amb: number;
    triangles: any[]; // TODO: next step
}