export class Location {
  private _uid: string;
  set uid(_uid: string) {
    this._uid = _uid;
  }
  get uid(): string {
    return this._uid;
  }

  constructor() {
    this._uid = '';
    // this._itemId = '';
    // this._laborCost = -1;
    // this._paintingCost = -1;
  }
}
