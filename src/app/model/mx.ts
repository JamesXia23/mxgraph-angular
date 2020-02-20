import {mxgraph} from 'ts-mxgraph-typings';
declare const require: any;

export const mx: typeof mxgraph = require('mxgraph')({
  mxBasePath: 'assets/mxgraph'
});
