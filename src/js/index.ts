import '../styles/index.scss';
import { Player } from './Player';
import { WebglManager } from './webgl/Manager';

const container = document.getElementById('scene') as HTMLElement;

const manager = new WebglManager(container, {});
manager.play();

const player = new Player({ manager, scene: manager.scene });

// eslint-disable-next-line no-console
console.log(player);
