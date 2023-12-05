import { Audio } from './Audio';
import { Equalizer } from './Equalizer';
import { IPlayerProps } from './types';

export class Player {
  private _equalizer: Equalizer;

  private _audio: Audio;

  constructor(private _props: IPlayerProps) {
    this._equalizer = new Equalizer(_props);

    this._audio = new Audio({
      ..._props,
      onUpdate: (props) => {
        this._equalizer.bassIntensity = props.bass;
        this._equalizer.highIntensity = props.high;
      },
      onPlay: () => {
        this._equalizer.isActive = true;
      },
      onPause: () => {
        this._equalizer.isActive = false;
      },
    });
  }

  public destroy() {
    this._equalizer.destroy();
    this._audio.destroy();
  }
}
