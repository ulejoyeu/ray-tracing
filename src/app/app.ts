import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import SceneInfos from './models/scene-infos';
import Material from './models/material';
import Sphere from './models/sphere';
import ObsScreenInfos from './models/obs-screen-infos';
import Vector3 from './models/vector3';
import { multScal, sum } from './math-utils';
import Light from './models/light';
import Color from './models/color';
import { pixColor } from './image-utils';
import { InputNumberModule } from 'primeng/inputnumber';
import { HttpClient } from '@angular/common/http';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-root',
  imports: [FormsModule, TextareaModule, InputNumberModule, ButtonModule, ToggleSwitchModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('ray-tracing');

  @ViewChild('canvas') canvas!: ElementRef;
  ctx!: CanvasRenderingContext2D;

  obsScreen!: string;
  scene!: string;

  canvasWidth: number = 100;
  canvasHeight: number = 100;

  obsScreenInfos: ObsScreenInfos|null = null;
  sceneInfos: SceneInfos|null = null;

  white: boolean = false;
  sign: boolean = false;

  isGeneratingImage = signal(false);

  scale: number = 2;

  httpClient = inject(HttpClient);

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
  }

  generateImage() {
    this.computeSceneInfos();
    this.computeObsScreenInfos();

    this.canvasWidth = this.obsScreenInfos?.columns! * this.scale;
    this.canvasHeight = this.obsScreenInfos?.lines! * this.scale;
    this.isGeneratingImage.set(true);
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    setTimeout(() => this.drawImage(), 2000);
  }
  
  drawImage() {
    const n = this.obsScreenInfos?.lines!;
    const m = this.obsScreenInfos?.columns!;
    const Cs = this.obsScreenInfos?.corner!;
    const vl = this.obsScreenInfos?.vline!;
    const vc = this.obsScreenInfos?.vcol!;
    
    const obs: Vector3 = this.obsScreenInfos?.observator!;
    const source: Light = this.sceneInfos?.light[0]!;
    const LS: Sphere[] = this.sceneInfos?.spheres!;
    const LT: any[] = [] // TODO: implement triangles
    const mats: Material[] = this.sceneInfos?.materials!;
    const amb: number = this.sceneInfos?.amb!;
    const groundColor: Color = this.sceneInfos?.groundColor!;

    console.log({obs, source, LS, LT, mats, amb, groundColor});

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {

        const pix: Vector3 = sum(sum(Cs, multScal(i, vc)), multScal(j,vl));
        const color: Color = pixColor(obs, pix, source, LS, LT, mats, amb, groundColor, this.sign, this.white);

        this.ctx.fillStyle = `rgb(${color.red}, ${color.green}, ${color.blue})`;
        this.ctx.fillRect(j * this.scale, i * this.scale, this.scale, this.scale);
      }
    }
    this.isGeneratingImage.set(false);
  }

  computeSceneInfos() {
    let sceneInfos: SceneInfos = {} as SceneInfos;

    const lines: Map<string,string[]> = this.readText(this.scene);
    const firstLine: string[] = lines.get('line 0')!;
    const nbMaterials = Number(firstLine[0]);
    const nbSpheres = Number(firstLine[1]);
    const nbTriangles = Number(firstLine[2])
    const nbLights = Number(firstLine[3]);

    sceneInfos.amb = Number(lines.get('line 1')![0]);

    const thirdLine: string[] = lines.get('line 2')!;
    sceneInfos.groundColor = {
      red: Number(thirdLine[0]),
      green: Number(thirdLine[1]),
      blue: Number(thirdLine[2]),
    }

    const materials: Material[] = [];
    for (let i = 0; i < nbMaterials; i++) {
      const currentLine: string[] = lines.get(`line ${3+i}`)!;
      const material: Material = {
        color: {
          red: Number(currentLine[0]),
          green: Number(currentLine[1]),
          blue: Number(currentLine[2]),
        },
        reflection: Number(currentLine[3])
      }
      materials.push(material);
    }
    sceneInfos.materials = materials;

    const spheres: Sphere[] = [];
    for (let i = 0; i < nbSpheres; i++) {
      const currentLine: string[] = lines.get(`line ${3+nbMaterials+i}`)!;
      const sphere: Sphere = {
        position: {
          x: Number(currentLine[0]),
          y: Number(currentLine[1]),
          z: Number(currentLine[2]),
        },
        radius: Number(currentLine[3]),
        materialId: Number(currentLine[4])
      };
      spheres.push(sphere);
    }
    sceneInfos.spheres = spheres;

    const lightLine: string[] = lines.get(`line ${3+nbMaterials+nbSpheres}`)!;
    sceneInfos.light = [{
      position: {
        x: Number(lightLine[0]),
        y: Number(lightLine[1]),
        z: Number(lightLine[2]),
      },
      intensity: {
        red: Number(lightLine[3]),
        green: Number(lightLine[4]),
        blue: Number(lightLine[5]),
      }
    }]

    this.sceneInfos = sceneInfos;
  }

  computeObsScreenInfos() {
    let obsScreenInfos: ObsScreenInfos = {} as ObsScreenInfos;

    const lines: Map<string, string[]> = this.readText(this.obsScreen);
    obsScreenInfos.lines = Number(lines.get('line 0')![0]);
    obsScreenInfos.columns = Number(lines.get('line 0')![1]);
    obsScreenInfos.corner = {
      x: Number(lines.get('line 1')![0]),
      y: Number(lines.get('line 1')![1]),
      z: Number(lines.get('line 1')![2]),
    };
    obsScreenInfos.vline = {
      x: Number(lines.get('line 2')![0]),
      y: Number(lines.get('line 2')![1]),
      z: Number(lines.get('line 2')![2]),
    };
    obsScreenInfos.vcol = {
      x: Number(lines.get('line 3')![0]),
      y: Number(lines.get('line 3')![1]),
      z: Number(lines.get('line 3')![2]),
    };
    obsScreenInfos.observator = {
      x: Number(lines.get('line 4')![0]),
      y: Number(lines.get('line 4')![1]),
      z: Number(lines.get('line 4')![2]),
    };

    this.obsScreenInfos = obsScreenInfos;
  }

  private readText(text: string): Map<string, string[]> {
    let lineIndex = 0;
    const res: Map<string,string[]> = new Map();
    for(const line of text.split('\n')) {
      res.set(`line ${lineIndex}`, line.split(' '));
      lineIndex++;
    }
    return res;
  }
}
