// plotly.js-dist-min ships no types; reuse the @types/plotly.js surface.
declare module 'plotly.js-dist-min' {
  import Plotly from 'plotly.js'
  export = Plotly
}
