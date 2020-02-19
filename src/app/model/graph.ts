import {mxgraph} from 'ts-mxgraph-typings';
import _ from 'lodash';

declare const require: any;

const mx: typeof mxgraph = require('mxgraph')({
  mxBasePath: 'assets/mxgraph'
});

Object.assign(mx.mxEvent, {
  EDGE_START_MOVE: 'edgeStartMove',
  VERTEX_START_MOVE: 'vertexStartMove',
});

export class Graph extends mx.mxGraph {

  static getStyleDict(cell) {
    return _.compact(cell.getStyle().split(';'))
      .reduce((acc, item) => {
        const [key, value] = item.split('=');
        acc[key] = value;
        return acc;
      }, {});
  }

  static convertStyleToString(styleDict) {
    const style = Object.entries(styleDict)
      .map(([key, value]) => `${key}=${value}`)
      .join(';')
      .replace(/=undefined/g, '');
    return `${style};`;
  }

  static getCellPosition(cell) {
    return _.pick(cell.getGeometry(), ['x', 'y']);
  }

  constructor(container) {
    super(container);
    this._init();
  }

  _init() {
    this._setDefaultConfig();
    this._configConstituent();
    this._putVertexStyle();
    this._setDefaultEdgeStyle();
    this._setAnchors();
    this._configCustomEvent();
    // this._configCoder();
  }

  _setDefaultConfig() {
    this.setConnectable(true);
    mx.mxEvent.disableContextMenu(this.container);

    // 固定节点大小
    this.setCellsResizable(false);

    // 编辑时按回车键不换行，而是完成输入
    this.setEnterStopsCellEditing(true);
    // 编辑时按 escape 后完成输入
    mx.mxCellEditor.prototype.escapeCancelsEditing = false;
    // 失焦时完成输入
    mx.mxCellEditor.prototype.blurEnabled = true;

    // 禁止节点折叠
    this.foldingEnabled = false;
    // 文本包裹效果必须开启此配置
    this.setHtmlLabels(true);

    // 拖拽过程对齐线
    mx.mxGraphHandler.prototype.guidesEnabled = true;

    // 禁止游离线条
    this.setDisconnectOnMove(false);
    this.setAllowDanglingEdges(false);
    mx.mxGraph.prototype.isCellMovable = cell => !cell.edge;

    // 禁止调整线条弯曲度
    this.setCellsBendable(false);

    // 禁止从将label从线条上拖离
    mx.mxGraph.prototype.edgeLabelsMovable = false;
  }

  _configConstituent() {
    // Redirects selection to parent
    this.selectCellForEvent = (...args) => {
      const [cell] = args;
      if (this.isPart(cell)) {
        args[0] = this.model.getParent(cell);
        mx.mxGraph.prototype.selectCellForEvent.call(this, args);
        return;
      }

      mx.mxGraph.prototype.selectCellForEvent.apply(this, args);
    };

    /**
     * Redirects start drag to parent.
     */
    const graphHandlerGetInitialCellForEvent = mx.mxGraphHandler.prototype.getInitialCellForEvent;
    mx.mxGraphHandler.prototype.getInitialCellForEvent = function getInitialCellForEvent(...args) {
      // this 是 mxGraphHandler
      let cell = graphHandlerGetInitialCellForEvent.apply(this, args);
      if (this.graph.isPart(cell)) {
        cell = this.graph.getModel().getParent(cell);
      }

      return cell;
    };
  }

  isPart(cell) {
    const state = this.view.getState(cell);
    const style = (state != null) ? state.style : this.getCellStyle(cell);
    return style.constituent === 1;
  }

  _putVertexStyle() {
    const normalTypeStyle = {
      [mx.mxConstants.STYLE_SHAPE]: mx.mxConstants.SHAPE_IMAGE,
      [mx.mxConstants.STYLE_PERIMETER]: mx.mxPerimeter.RectanglePerimeter,
    };
    this.getStylesheet().putCellStyle('normalType', normalTypeStyle);

    const nodeStyle = {
      // 图片样式参考这个例子
      // https://github.com/jinzhanye/mxgraph-demos/blob/master/src/06.image.html
      [mx.mxConstants.STYLE_SHAPE]: mx.mxConstants.SHAPE_LABEL,
      [mx.mxConstants.STYLE_PERIMETER]: mx.mxPerimeter.RectanglePerimeter,
      [mx.mxConstants.STYLE_ROUNDED]: true,
      [mx.mxConstants.STYLE_ARCSIZE]: 6, // 设置圆角程度

      [mx.mxConstants.STYLE_STROKECOLOR]: '#333333',
      [mx.mxConstants.STYLE_FONTCOLOR]: '#333333',
      [mx.mxConstants.STYLE_FILLCOLOR]: '#ffffff',
      //
      [mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: 'none',

      [mx.mxConstants.STYLE_ALIGN]: mx.mxConstants.ALIGN_CENTER,
      [mx.mxConstants.STYLE_VERTICAL_ALIGN]: mx.mxConstants.ALIGN_TOP,
      [mx.mxConstants.STYLE_IMAGE_ALIGN]: mx.mxConstants.ALIGN_CENTER,
      [mx.mxConstants.STYLE_IMAGE_VERTICAL_ALIGN]: mx.mxConstants.ALIGN_TOP,

      [mx.mxConstants.STYLE_IMAGE_WIDTH]: '72',
      [mx.mxConstants.STYLE_IMAGE_HEIGHT]: '72',
      [mx.mxConstants.STYLE_SPACING_TOP]: '100',
      [mx.mxConstants.STYLE_SPACING]: '8',
    };
    this.getStylesheet().putCellStyle('node', nodeStyle);

    // 设置选中状态节点的边角为圆角，默认是直角
    const oldCreateSelectionShape = mx.mxVertexHandler.prototype.createSelectionShape;
    mx.mxVertexHandler.prototype.createSelectionShape = function createSelectionShape(...args) {
      const res = oldCreateSelectionShape.apply(this, args);
      res.isRounded = true;
      // style 属性来自 mxShape , mxRectangle 继承自 mxShape
      res.style = {
        arcSize: 6,
      };
      return res;
    };
  }

  _setDefaultEdgeStyle() {
    const style = this.getStylesheet().getDefaultEdgeStyle();
    Object.assign(style, {
      [mx.mxConstants.STYLE_ROUNDED]: true, // 设置线条拐弯处为圆角
      [mx.mxConstants.STYLE_STROKEWIDTH]: '2',
      [mx.mxConstants.STYLE_STROKECOLOR]: '#333333',
      [mx.mxConstants.STYLE_EDGE]: mx.mxConstants.EDGESTYLE_ORTHOGONAL,
      [mx.mxConstants.STYLE_FONTCOLOR]: '#33333',
      [mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: '#ffa94d',
    });
    // 设置拖拽线的过程出现折线，默认为直线
    this.connectionHandler.createEdgeState = () => {
      const edge = this.createEdge(undefined, undefined, undefined, undefined, undefined);
      return new mx.mxCellState(this.view, edge, this.getCellStyle(edge));
    };
  }

  _setAnchors() {
    // 禁止从节点中心拖拽出线条
    this.connectionHandler.isConnectableCell = () => false;
    mx.mxEdgeHandler.prototype.isConnectableCell = () => false;

    // Overridden to define per-shape connection points
    mx.mxGraph.prototype.getAllConnectionConstraints = (terminal) => {
      if (terminal != null && terminal.shape != null) {
        if (terminal.shape.stencil != null) {
          return terminal.shape.stencil.constraints;
        } else if (terminal.shape.constraints != null) {
          return terminal.shape.constraints;
        }
      }

      return null;
    };

    // Defines the default constraints for all shapes
    mx.mxShape.prototype['constraints'] = [
      new mx.mxConnectionConstraint(new mx.mxPoint(0, 0), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0, 1), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(1, 0), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(1, 1), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.25, 0), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.5, 0), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.75, 0), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.25), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.5), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.75), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.25), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.5), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.75), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.25, 1), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.5, 1), true),
      new mx.mxConnectionConstraint(new mx.mxPoint(0.75, 1), true)];
  }

  _configCustomEvent() {
    const graph = this;
    const oldStart = mx.mxEdgeHandler.prototype.start;
    mx.mxEdgeHandler.prototype.start = function start(...args) {
      oldStart.apply(this, args);
      graph.fireEvent(new mx.mxEventObject(mx.mxEvent['EDGE_START_MOVE'],
        'edge', this.state.cell,
        'source', this.isSource,
      ));
    };


    const oldCreatePreviewShape = mx.mxGraphHandler.prototype.createPreviewShape;
    mx.mxGraphHandler.prototype.createPreviewShape = function createPreviewShape(...args) {
      graph.fireEvent(new mx.mxEventObject(mx.mxEvent['VERTEX_START_MOVE']));
      return oldCreatePreviewShape.apply(this, args);
    };
  }

  getDom(cell) {
    const state = this.view.getState(cell);
    return state.shape.node;
  }

  setStyle(cell, key, value) {
    const styleDict = Graph.getStyleDict(cell);
    styleDict[key] = value;
    const style = Graph.convertStyleToString(styleDict);
    this.getModel().setStyle(cell, style);
  }

  deleteSubtree(cell) {
    const cells = [];
    this.traverse(cell, true, (vertex) => {
      cells.push(vertex);
      return true;
    });
    this.removeCells(cells);
  }

  _restoreModel() {
    Object.values(this.getModel().cells)
      .forEach(cell => {
        if (cell['vertex'] && cell['data']) {
          cell['data'] = JSON.parse(cell['data']);
        }
      });
  }

  importModelXML(xmlTxt) {
    this.getModel().beginUpdate();
    try {
      const doc = mx.mxUtils.parseXml(xmlTxt);
      const root = doc.documentElement;
      const dec = new mx.mxCodec(root.ownerDocument);
      dec.decode(root, this.getModel());
    } finally {
      this.getModel().endUpdate();
    }
    this._restoreModel();
  }

  exportModelXML() {
    const enc = new mx.mxCodec(mx.mxUtils.createXmlDocument());
    const node = enc.encode(this._getExportModel());
    return mx.mxUtils.getPrettyXml(node);
  }

  // 将 data 变为字符串，否则还原时会报错
  _getExportModel() {
    const model = _.cloneDeep(this.getModel());
    Object.values(model.cells)
      .forEach(cell => {
        if (cell['vertex'] && cell['data']) {
          cell['data'] = JSON.stringify(cell['data']);
        }
      });
    return model;
  }

  exportPicXML() {
    const xmlDoc = mx.mxUtils.createXmlDocument();
    const root = xmlDoc.createElement('output');
    xmlDoc.appendChild(root);

    const { scale } = this.view;
    // 这个项目画布边宽为0，可以自行进行调整
    const border = 0;

    const bounds = this.getGraphBounds();
    const xmlCanvas = new mx.mxXmlCanvas2D(root);
    xmlCanvas.translate(
      Math.floor((border / scale - bounds.x) / scale),
      Math.floor((border / scale - bounds.y) / scale),
    );
    xmlCanvas.scale(1);

    const imgExport = new mx.mxImageExport();
    imgExport.drawState(this.getView().getState(this.model.root), xmlCanvas);

    const w = Math.ceil(bounds.width * scale / scale + 2 * border);
    const h = Math.ceil(bounds.height * scale / scale + 2 * border);

    const xml = mx.mxUtils.getPrettyXml(root);

    return {
      xml,
      w,
      h,
    };
  }
}
