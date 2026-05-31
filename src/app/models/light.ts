import Color from "./color";
import Vector3 from "./vector3";

export default interface Light {
    position: Vector3;
    intensity: Color;
}