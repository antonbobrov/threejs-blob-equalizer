import { Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { NCallbacks, lerp } from '@anton.bobrov/vevet-init';
import { createDatGUISettings } from '@anton.bobrov/react-dat-gui';
import { IEqualizerProps, IWithLerp } from './types';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import noise from './shaders/noise.glsl';

export class Equalizer {
  private _dagGUI: ReturnType<typeof createDatGUISettings>;

  private _startSize: { width: number; height: number };

  private _mesh: Mesh;

  private _geometry: PlaneGeometry;

  private _material: ShaderMaterial;

  private _managerEvents: NCallbacks.IAddedCallback[] = [];

  private _bassIntensity: IWithLerp = { current: 0, target: 0 };

  set bassIntensity(value: number) {
    this._bassIntensity.target = value;
  }

  private _highIntensity: IWithLerp = { current: 0, target: 0 };

  set highIntensity(value: number) {
    this._highIntensity.target = value;
  }

  private _isActive = false;

  set isActive(value: boolean) {
    this._isActive = value;
  }

  private get aspectRatio() {
    const { manager } = this._initialProps;

    return manager.width / manager.height;
  }

  constructor(private _initialProps: IEqualizerProps) {
    const { manager, scene } = this._initialProps;

    // dat gui
    const datGUI = createDatGUISettings({
      name: 'Player Equalizer',
      settings: {
        isFull: { value: false, type: 'boolean' },
        radius: { value: 0.4, type: 'number', min: 0.35, max: 1, step: 0.0001 },
        step: { value: 0.6, type: 'number', min: 0.1, max: 0.75, step: 0.0001 },
        color1: { value: 0xff0000, type: 'color' },
        color2: { value: 0x00ff00, type: 'color' },
        timeAcceleration: {
          value: 0.15,
          type: 'number',
          min: 0,
          max: 1,
          step: 0.0001,
        },
        radiusAcceleration: {
          value: 0.7,
          type: 'number',
          min: 0,
          max: 1,
          step: 0.0001,
        },
        radiusDistortion: {
          value: 0.25,
          type: 'number',
          min: 0,
          max: 1,
          step: 0.0001,
        },
      },
      onChange: (data) => {
        this._material.uniforms.u_isFull.value = data.isFull;
        this._material.uniforms.u_radius.value = data.radius;
        this._material.uniforms.u_step.value = data.step;
        this._material.uniforms.u_color1.value = new Color(data.color1);
        this._material.uniforms.u_color2.value = new Color(data.color2);
        this._material.uniforms.u_timeAcceleration.value =
          data.timeAcceleration;
        this._material.uniforms.u_radiusAcceleration.value =
          data.radiusAcceleration;
        this._material.uniforms.u_radiusDistortion.value =
          data.radiusDistortion;
      },
    });
    this._dagGUI = datGUI;

    // save initial size
    this._startSize = {
      width: manager.width,
      height: manager.height,
    };

    // create geometry
    this._geometry = new PlaneGeometry(
      this._startSize.width,
      this._startSize.height,
    );

    // create shader material
    this._material = new ShaderMaterial({
      vertexShader,
      fragmentShader: noise + fragmentShader,
      uniforms: {
        u_aspect: { value: this.aspectRatio },
        u_time: { value: 0 },
        u_isFull: { value: datGUI.settings.isFull },
        u_radius: { value: datGUI.settings.radius },
        u_step: { value: datGUI.settings.step },
        u_color1: { value: new Color(datGUI.settings.color1) },
        u_color2: { value: new Color(datGUI.settings.color2) },
        u_bassIntensity: { value: 0 },
        u_highIntensity: { value: 0 },
        u_activeProgress: { value: 0 },
        u_timeAcceleration: { value: datGUI.settings.timeAcceleration },
        u_radiusAcceleration: { value: datGUI.settings.radiusAcceleration },
        u_radiusDistortion: { value: datGUI.settings.radiusDistortion },
      },
    });

    // create mesh
    this._mesh = new Mesh(this._geometry, this._material);
    scene.add(this._mesh);

    // resize
    this._managerEvents.push(
      manager.callbacks.add('resize', () => this._resize()),
    );

    // render
    this._managerEvents.push(
      manager.callbacks.add('render', () => this._render()),
    );
  }

  /** Resize the scene */
  private _resize() {
    const { _startSize: startSize, _initialProps: initialProps } = this;

    const { width, height } = initialProps.manager;
    const widthScale = width / startSize.width;
    const heightScale = height / startSize.height;

    // set mesh scale
    this._mesh.scale.set(widthScale, heightScale, 1);

    // update aspect ratio
    this._material.uniforms.u_aspect.value = this.aspectRatio;
  }

  /** Render the scene */
  private _render() {
    const { _bassIntensity: bass, _highIntensity: high } = this;
    const { uniforms } = this._material;

    uniforms.u_time.value += 0.002;

    const intensityLerp = 0.05;

    bass.current = lerp(bass.current, bass.target, intensityLerp);
    uniforms.u_bassIntensity.value = bass.current;

    high.current = lerp(high.current, high.target, intensityLerp);
    uniforms.u_highIntensity.value = high.current;

    uniforms.u_activeProgress.value = lerp(
      uniforms.u_activeProgress.value,
      this._isActive ? 1 : 0,
      0.1,
    );
  }

  /** Destroy the scene */
  destroy() {
    this._initialProps.scene.remove(this._mesh);
    this._material.dispose();
    this._geometry.dispose();

    this._managerEvents.forEach((event) => event.remove());

    this._dagGUI.destroy();
  }
}
