import { IAddEventListener, addEventListener } from 'vevet-dom';
import { IProps } from './types';
import { DomHelper } from './DomHelper';

export class Audio {
  private _container: HTMLElement;

  private _input: HTMLInputElement;

  private _audio?: HTMLAudioElement;

  private _listeners: IAddEventListener[] = [];

  private _context?: AudioContext;

  private _analyzer?: AnalyserNode;

  private _dataArray?: Uint8Array;

  private _domHelper?: DomHelper;

  constructor(private _props: IProps) {
    this._container = document.createElement('div');
    this._container.classList.add('player-audio');
    document.body.appendChild(this._container);

    this._input = document.createElement('input');
    this._input.type = 'file';
    this._input.accept = 'audio/mpeg';
    this._container.appendChild(this._input);

    this._input.addEventListener('change', () => {
      const { files } = this._input;
      if (!files || files.length < 1) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          this._createAudio(event.target.result as string);
        }
      };

      reader.readAsDataURL((files as any)[0]);
    });
  }

  private _createAudio(src: string) {
    this._input.remove();

    this._audio = document.createElement('audio');
    this._audio.controls = true;
    this._container.appendChild(this._audio);

    const source = document.createElement('source');
    source.src = src;
    source.type = 'audio/mpeg';
    this._audio.appendChild(source);

    this._listeners.push(
      addEventListener(this._audio, 'play', () => {
        this._createContext();
        this._props.onPlay();
      }),
    );

    this._listeners.push(
      addEventListener(this._audio, 'timeupdate', () => this._onTimeUpdate()),
    );

    this._listeners.push(
      addEventListener(this._audio, 'pause', () => {
        this._props.onUpdate({ bass: 0, high: 0 });
        this._props.onPause();
      }),
    );

    this._audio.play();
  }

  private _createContext() {
    if (this._context || !this._audio) {
      return;
    }

    this._context = new AudioContext();
    const mediaElementSource = this._context.createMediaElementSource(
      this._audio,
    );

    this._analyzer = this._context.createAnalyser();
    mediaElementSource.connect(this._analyzer);
    this._analyzer.connect(this._context.destination);
    this._analyzer.fftSize = 64;

    const bufferLength = this._analyzer.frequencyBinCount;
    this._dataArray = new Uint8Array(bufferLength);

    if (process.env.NODE_ENV === 'development') {
      this._domHelper = new DomHelper();
    }
  }

  private _onTimeUpdate() {
    if (!this._analyzer || !this._dataArray) {
      return;
    }

    this._analyzer.getByteTimeDomainData(this._dataArray);

    this._domHelper?.update(this._dataArray);

    const bass = this._getIntensity(20, 30);
    const high = this._getIntensity(2, 10);

    this._props.onUpdate({ bass, high });
  }

  private _getIntensity(from: number, to: number) {
    if (!this._dataArray) {
      return 0;
    }

    let sum = 0;
    for (let i = from; i < to; i += 1) {
      sum += this._dataArray[i];
    }

    sum /= (to - from) * 255;

    return sum;
  }

  public destroy() {
    this._container.remove();
    this._listeners.forEach((listener) => listener.remove());
    this._context?.close();
    this._domHelper?.destroy();
  }
}
