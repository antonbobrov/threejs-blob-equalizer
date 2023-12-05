import { Object3D } from 'three';
import { WebglManager } from '../../webgl/Manager';

export interface IEqualizerProps {
  manager: WebglManager;
  scene: Object3D;
}

export interface IWithLerp {
  current: number;
  target: number;
}
