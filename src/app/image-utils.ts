import { dotLine, dotProd, hidden, interLineObjects, normaleSphere, nvector } from "./math-utils";
import Color from "./models/color";
import Light from "./models/light";
import Material from "./models/material";
import ObjectIntersection from "./models/object-intersection";
import Sphere from "./models/sphere";
import Vector3 from "./models/vector3";

export function pixColor(
    obs: Vector3, pix: Vector3, source: Light, LS: Sphere[], LT: any[],
    mats: Material[], amb: number, groundColor: Color, sign: boolean = false, white: boolean = false): Color {

    const intersection: ObjectIntersection|null = interLineObjects(obs, pix, LS, LT);
    // console.log({intersection});
    if (intersection === null) {
        // TODO: sign false
        return groundColor;
    }
    else {
        if (intersection.objectType === 'sphere') {
            const sphere: Sphere = LS[intersection.index];
            const sphereColor: Color = mats[sphere.materialId].color
            if (sign) return sphereColor;
            else {
                const alpha = intersection.parameter;
                const P = dotLine(obs, pix, alpha);
                const L = source.position;
                // TODO: fix hidden function
                if (false && hidden(P, L, LS, LT)) {
                    if (white) return {red: 255, green: 255, blue: 255};
                    return {
                        red: amb * source.intensity.red * sphereColor.red,
                        green: amb * source.intensity.green * sphereColor.green,
                        blue: amb * source.intensity.blue * sphereColor.blue
                    }
                } else {
                    console.log('not hidden');
                    const n: Vector3 = normaleSphere(sphere, P);
                    const s: Vector3 = nvector(P, L);
                    const cos_alpha = dotProd(n, s);
                    return {
                        red: (amb + (1-amb) * Math.max(cos_alpha, 0)) * source.intensity.red * sphereColor.red,
                        green: (amb + (1-amb) * Math.max(cos_alpha, 0)) * source.intensity.green * sphereColor.green,
                        blue: (amb + (1-amb) * Math.max(cos_alpha, 0)) * source.intensity.blue * sphereColor.blue
                    }
                }
            }
        }
        return {red: 0, green: 0, blue: 0}; // TODO: delete this, instead triangles
    }
}