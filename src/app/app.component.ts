import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {mxgraph} from 'ts-mxgraph-typings';
import {Graph} from './model/graph';


declare const require: any;

const mx: typeof mxgraph = require('mxgraph')({
  mxBasePath: 'assets/mxgraph'
});

Object.assign(mx.mxEvent, {
  NORMAL_TYPE_CLICKED: 'NORMAL_TYPE_CLICKED',
});
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'mxgraph-angular';
  elements = [{
    id: 1,
    icon: 'ele-005.png',
    title: '智爷',
  }, {
    id: 2,
    icon: 'ele-006.jpg',
    title: '皮卡丘',
  }, {
    id: 3,
    icon: 'ele-001.jpeg',
    title: '我是皮卡丘的超级超级进化',
  }, {
    id: 4,
    icon: 'ele-002.png',
    title: '小火龙',
  }, {
    id: 5,
    icon: 'ele-003.jpeg',
    title: '杰尼龟',
  }, {
    id: 6,
    icon: 'ele-004.jpg',
    title: '妙蛙种子',
  }];

  @ViewChild('graphContainer')
  graphContainer: ElementRef;

  graph: mxgraph.mxGraph;
  outline: mxgraph.mxOutline;
  idSeed = 0;

  ngOnInit(): void {

    // this.graph = new mx.mxGraph(this.dashboard.nativeElement);
    // const parent = this.graph.getDefaultParent();
    //
    // const v1 = this.graph.insertVertex(parent, null, 'hello, ', 20, 20, 80, 30);
    // const v2 = this.graph.insertVertex(parent, null, 'world!', 200, 150, 80, 30);
    // const e1 = this.graph.insertEdge(parent, null, 'test', v1, v2);
  }


  private initGraph() {
    this.graph = new Graph(document.getElementById('graphContainer'));
    this.outline = new mx.mxOutline(this.graph, document.getElementById('graphOutline'));
    // 将外元素拖拽进画布参考这个例子
    // https://github.com/jinzhanye/mxgraph-demos/blob/master/src/07.drag.html
    this.makeDraggable(document.getElementsByClassName('element-img'));
    this.listenGraphEvent();
    this.setCursor();
    this.setConnectValidation();
  }

  makeDraggable(sourceEles: HTMLCollectionOf<Element>) {
    const _ = this;
    const dropValidate = function (evt) {
      const x = mx.mxEvent.getClientX(evt);
      const y = mx.mxEvent.getClientY(evt);
      // 获取 x,y 所在的元素
      const elt = document.elementFromPoint(x, y);
      // 如果鼠标落在graph容器
      if (mx.mxUtils.isAncestorNode(_.graph.container, elt)) {
        return _.graph;
      }
      // 鼠标落在其他地方
      return null;
    };

    // drop成功后新建一个节点
    const dropSuccessCb = function (_graph, evt, target, x, y) {
      _.insertVertex(this.element, target, x, y);
    };

    Array.from(sourceEles).forEach((ele) => {
      console.log(ele);
      const dragElt = document.createElement('img');
      dragElt.setAttribute('src', ele.getAttribute('src'));
      dragElt.setAttribute('style', 'width:120px;height:120px;');

      mx.mxUtils.makeDraggable(ele, dropValidate, dropSuccessCb, dragElt,
        null, null, null, true);
    });
  }

  insertVertex(dom, target, x, y) {
    const src = dom.getAttribute('src');
    const id = Number(dom.getAttribute('id'));
    const nodeRootVertex = new mx.mxCell('鼠标双击输入', new mx.mxGeometry(0, 0, 100, 135), `node;image=${src}`);
    nodeRootVertex.vertex = true;
    // 自定义的业务数据放在 data 属性
    this.idSeed++;
    nodeRootVertex['data'] = {
      id: this.idSeed,
      element: this.elements.find((element) => element.id === id),
      normalType: '',
    };

    const title = dom.getAttribute('alt');
    const titleVertex = this.graph.insertVertex(nodeRootVertex, null, title,
      0.1, 0.65, 80, 16,
      'constituent=1;whiteSpace=wrap;strokeColor=none;fillColor=none;fontColor=#e6a23c',
      true);
    titleVertex.setConnectable(false);

    const normalTypeVertex = this.graph.insertVertex(nodeRootVertex, null, null,
      0.05, 0.05, 19, 14,
      `normalType;constituent=1;fillColor=none;image=/assets/images/normal-type/forest.png`,
      true);
    normalTypeVertex.setConnectable(false);

    const cells = this.graph.importCells([nodeRootVertex], x, y, target);
    if (cells != null && cells.length > 0) {
      this.graph.setSelectionCells(cells);
    }
  }

  listenGraphEvent() {
    this.graph.addListener(mx.mxEvent.CLICK, (sender, evt) => {
      const cell = evt.properties.cell;
      if (!cell) {
        return;
      }

      const clickNormalType = cell.style.includes('normalType');
      if (clickNormalType) {
        // 使用 mxGraph 事件中心，触发自定义事件
        this.graph.fireEvent(new mx.mxEventObject(mx.mxEvent['NORMAL_TYPE_CLICKED'], 'cell', cell));
      }
    });
  }

  setCursor() {
    const oldGetCursorForCell = mx.mxGraph.prototype.getCursorForCell;
    this.graph.getCursorForCell = function (...args) {
      const [cell] = args;
      return cell.style.includes('normalType') ?
        'pointer' :
        oldGetCursorForCell.apply(this, args);
    };
  }

  setConnectValidation() {
    // 连接边校验
    mx.mxGraph.prototype.isValidConnection = (source, target) => {
      const sourceElementId = source.data.element.id;
      const targetElementId = target.data.element.id;
      // 如果源点是智爷，终点必须是 皮卡丘 或 我是皮卡丘的超级超级进化
      if (sourceElementId === 1) {
        return targetElementId === 2 || targetElementId === 3;
      }

      // 如果终点是智爷同理
      if (targetElementId === 1) {
        return sourceElementId === 2 || sourceElementId === 3;
      }

      return true;
    };
  }

  ngAfterViewInit(): void {
    this.initGraph();
  }
}
