/// <reference path="../d3/d3.d.ts"/>

declare module D3 {
  interface PCA {
    (selection: D3.Selection): void;
  }

  interface Base extends Selectors {
    pca(): PCA;
  }
}
