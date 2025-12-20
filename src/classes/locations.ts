import {Location} from './location';

export class Locations {
  private _items: Location[];
  set items(_items: Location[]) {
    this._items = _items;
  }
  get items(): Location[] {
    return this._items;
  }

  constructor() {
    this._items = [];
    // this._itemId = '';
    // this._laborCost = -1;
    // this._paintingCost = -1;
  }
}
