import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {mxgraph} from 'ts-mxgraph-typings';


declare const require: any;

const mx: typeof mxgraph = require('mxgraph')({
  mxBasePath: 'assets/mxgraph'
});
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mxgraph-angular';

  @ViewChild('dashboard')
  dashboard: ElementRef;

  private graph: mxgraph.mxGraph;

  ngOnInit(): void {
    this.graph = new mx.mxGraph(this.dashboard.nativeElement);
    const parent = this.graph.getDefaultParent();

    const v1 = this.graph.insertVertex(parent, null, 'hello, ', 20, 20, 80, 30);
    const v2 = this.graph.insertVertex(parent, null, 'world!', 200, 150, 80, 30);
    const e1 = this.graph.insertEdge(parent, null, 'test', v1, v2);
  }
}
