import Vector3 from "./vector3";

export default interface ObsScreenInfos {
    lines: number;
    columns: number;
    corner: Vector3;
    vline: Vector3;
    vcol: Vector3;
    observator: Vector3;
}