import ObjectIntersection from "./models/object-intersection";
import Sphere from "./models/sphere";
import Vector3 from "./models/vector3";

export function vector(A: Vector3, B: Vector3): Vector3 {
    return {
        x: B.x - A.x,
        y: B.y - A.y,
        z: B.z - A.z
    };
}

export function sum(A: Vector3, B: Vector3): Vector3 {
    return {
        x: A.x + B.x,
        y: A.y + B.y,
        z: A.z + B.z
    };
}

export function multScal(scal: number, A: Vector3): Vector3 {
    return {
        x: scal * A.x,
        y: scal * A.y,
        z: scal * A.z
    };
}

export function dotProd(A: Vector3, B: Vector3): number {
    return A.x * B.x + A.y  * B.y + A.z * B.z;
}

export function dotLine(A: Vector3, B: Vector3, alpha: number) {
    const AB = vector(A, B);
    return sum(A, multScal(alpha, AB));
}

export function approxZero(n: number, epsilon: number = 0.001): number {
    if (Math.abs(n) < epsilon) return 0;
    return n;
}

export function solveSecond(a: number, b: number, c: number, epsilon=0.0001): (number|null)[] {
    const delta = b*b - 4*a*c;
    if (delta < 0) {
        return [-1, null, null];
    }
    else if (delta === 0) {
        const doubleRoot = approxZero(-b/(2*a));
        return [0, doubleRoot, doubleRoot];
    } else {
        return [1, approxZero((-b - Math.sqrt(delta))/(2*a)), approxZero((-b + Math.sqrt(delta))/(2*a))];
    }
}

export function nvector(A: Vector3, B: Vector3): Vector3 {
    const AB: Vector3 = vector(A, B);
    const norm: number = Math.sqrt(dotProd(AB, AB));
    return multScal(1/norm, AB);
}

export function interLineSphere(A: Vector3, B: Vector3, C: Vector3, r: number): number|null {
    const AB = vector(A, B);
    const CA = vector(C, A);
    const [delta, sol1, sol2] = solveSecond(dotProd(AB,AB), 2*dotProd(AB,CA), dotProd(CA,CA) - r*r);
    if (delta === -1) {
        return null;
    } else if (delta === 0) {
        return sol1! >= 0 ? sol1 : null;
    }
    const res = Math.min(sol1!, sol2!);
    return res >= 0 ? res : null;
}

export function interLineObjects(A1: Vector3, A2: Vector3, LS: Sphere[], LT: any[], hidden: boolean = false): ObjectIntersection|null {
    let objectIntersection: ObjectIntersection|null = null;
    for (const [index, sphere] of LS.entries()) {
        const sphereIntersection: number|null = interLineSphere(A1, A2, sphere.position, sphere.radius);
        if (sphereIntersection !== null) {
            if (objectIntersection === null) {
                objectIntersection = {
                    objectType: 'sphere',
                    parameter: sphereIntersection,
                    index
                };
                if (hidden && sphereIntersection < 1) break;
            }
            else if (sphereIntersection < objectIntersection.parameter) {
                objectIntersection = {
                    objectType: 'sphere',
                    parameter: sphereIntersection,
                    index
                }
            }  
        }
    }
    return objectIntersection;
}

export function hidden(P: Vector3, L: Vector3, LS: Sphere[], LT: any[]) {
    const intersection: ObjectIntersection|null = interLineObjects(P, L, LS, LT, true);
    return intersection !== null;
}

export function normaleSphere(S: Sphere, P: Vector3) {
    const C: Vector3 = S.position;
    return nvector(C,P);
}