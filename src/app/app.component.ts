import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {mxgraph} from 'ts-mxgraph-typings';
import {Graph} from './model/graph';
import {NzMessageService, UploadChangeParam} from 'ng-zorro-antd';
import {mx} from './model/mx';
import FileSaver from 'file-saver';

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

  normalTypeOptions = [{
    label: '电',
    icon: 'thunder.png',
  }, {
    label: '火',
    icon: 'fire.png',
  }, {
    label: '草',
    icon: 'forest.png',
  }, {
    label: '水',
    icon: 'water.png',
  }];

  normalTypeSelectVisible = false;
  normalTypePosition = {
    top: '0',
    left: '0',
  };

  @ViewChild('graphContainer')
  graphContainer: ElementRef;

  graph: Graph;
  outline: mxgraph.mxOutline;
  idSeed = 0;
  selectVertex: mxgraph.mxCell;
  selectEdge: mxgraph.mxCell;

  constructor(private message: NzMessageService) {
  }

  ngOnInit(): void {
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

  /**
   * 让图片可以被拖动，并且检测可否放置以及放置完增加一个组件
   * @param sourceEles
   */
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
      const dragElt = document.createElement('img');
      dragElt.setAttribute('src', ele.getAttribute('src'));
      dragElt.setAttribute('style', 'width:120px;height:120px;');

      mx.mxUtils.makeDraggable(ele, dropValidate, dropSuccessCb, dragElt,
        null, null, null, true);
    });
  }

  /**
   * 插入一个节点
   * @param dom
   * @param target
   * @param x
   * @param y
   */
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
      normalType: 'forest.png',
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

  /**
   * 添加事件
   */
  listenGraphEvent() {
    // 监听自定义事件
    // 选择属性
    this.graph.addListener(mx.mxEvent['NORMAL_TYPE_CLICKED'], (sender, evt) => {

      const normalTypeDom = this.graph.getDom(evt.getProperty('cell'));
      const normalTypePosition = normalTypeDom.getBoundingClientRect();
      this.normalTypePosition.left = normalTypePosition.left - 210 + 80 + 'px';
      this.normalTypePosition.top = normalTypePosition.top - 8 + 'px';
      this.normalTypeSelectVisible = true;
    });
    this.graph.addListener(mx.mxEvent['VERTEX_START_MOVE'], () => {
      this.normalTypeSelectVisible = false;
    });

    // 监听 mxGraph 事件
    // 在画布上点击
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

    // 改变选择的model
    const mxGraphSelectionModel = this.graph.getSelectionModel();
    mxGraphSelectionModel.addListener(mx.mxEvent.CHANGE, (selectModel) => {
      this.selectVertex = null;
      this.selectEdge = null;
      if (!selectModel.cells.length) {
        return;
      }

      const cell = selectModel.cells[0];

      // 另一种获取当前节点的方法
      // const selectionCell = graph.getSelectionCell();
      // console.log(selectionCell === cell); // true

      if (cell.vertex) {
        this.selectVertex = cell;
      } else {
        this.selectEdge = cell;
      }
    });

    // 坐标提示
    this.graph.addListener(mx.mxEvent.MOVE_CELLS, (sender, evt) => {
      const cell = evt.properties.cells[0];
      const position = Graph.getCellPosition(cell);
      setTimeout(() => this.message.info('节点被移动到' + JSON.stringify(position)), 500);
    });

    // 增加cell
    this.graph.addListener(mx.mxEvent.CELLS_ADDED, (sender, evt) => {
      const cell = evt.properties.cells[0];
      if (this.graph.isPart(cell)) {
        return;
      }

      if (cell.vertex) {
        this.message.info('添加了一个节点');
      } else if (cell.edge) {
        this.message.info('添加了一条线');
      }
    });

    // 内容改变
    this.graph.addListener(mx.mxEvent.LABEL_CHANGED, (sender, evt) => {
      this.message.info('内容改变为：' + evt.getProperty('value'));
    });

    // 连线改变
    this.graph.addListener(mx.mxEvent.CONNECT_CELL, (sender, evt) => {
      this.message.info('改变了连线');
    });
  }

  /**
   * 重载getCursorForCell，设置鼠标放置到属性选择上时显示小手
   */
  setCursor() {
    const oldGetCursorForCell = mx.mxGraph.prototype.getCursorForCell;
    this.graph.getCursorForCell = function (...args) {
      const [cell] = args;
      return cell.style.includes('normalType') ?
        'pointer' :
        oldGetCursorForCell.apply(this, args);
    };
  }

  /**
   * 限制边的连接
   */
  setConnectValidation() {
    // 连接边校验
    mx.mxGraph.prototype.isValidConnection = (source, target) => {
      if (!source.data || !source.data.element || !target.data || !target.data.element) {
        return true;
      }
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

  /**
   * 改变属性
   * @param val
   */
  changeNormalType(val: any) {
    this.selectVertex['data']['normalType'] = val;
    const normalTypeVertex = this.selectVertex.children[1];
    this.graph.setStyle(normalTypeVertex, 'image', '/assets/images/normal-type/' + val);
    this.normalTypeSelectVisible = false;
  }

  ngAfterViewInit(): void {
    this.initGraph();
  }

  /**
   * 删除节点或者边
   */
  delete() {
    if (this.selectVertex) {
      this.graph.deleteSubtree(this.selectVertex);
    } else {
      this.graph.removeCells([this.selectEdge]);
    }
  }

  // 导出、导入功能参考这个例子
  // https://github.com/jgraph/mxgraph/blob/master/javascript/examples/fileio.html
  /**
   * 导出
   */
  exportFile() {
    const xml = this.graph.exportModelXML();
    const blob = new Blob([xml], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, 'pocket_monster.xml');
  }

  /**
   * 点击导入文件框
   */
  importFile(importInput: HTMLInputElement) {
    importInput.click();
  }

  /**
   * 读取文件
   * @param event
   */
  readFile(event: Event) {
    const file = event.target['files'][0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const txt = e.target['result'];
      this.graph.importModelXML(txt);
    };
    reader.readAsText(file);
  }
}
