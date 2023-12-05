export class DomHelper {
  private _container: HTMLElement;

  private _elements: HTMLElement[] = [];

  constructor() {
    this._container = document.createElement('div');
    this._container.classList.add('audio-dom-helper');

    document.body.appendChild(this._container);
  }

  public update(array: Uint8Array) {
    if (this._elements.length === 0) {
      this._create(array.length);
    }

    for (let i = 0; i < array.length; i += 1) {
      const element = this._elements[i];
      element.style.transform = `scale(1, ${array[i] / 255})`;
    }
  }

  private _create(length: number) {
    for (let i = 0; i < length; i += 1) {
      const element = document.createElement('div');
      this._container.appendChild(element);

      this._elements.push(element);
    }
  }

  public destroy() {
    this._container.remove();
  }
}
