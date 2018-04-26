
const DG = 1;  // 有向图
const DN = 2;
const UDG = 3;
const UND = 4;

//
// @param {Number} adj
// @param {*} info
// @constructor
//
function ArcCell(adj, info) {
    // 顶点类型。对于无权图，用1或0表示相邻与否；对带权图，则为权值类型
    this.adj = (typeof adj === 'number') ? adj : Infinity;
    // 该弧相关信息
    this.info = info || null;
}

//
// @param {Array} vexs 顶点向量
// @param {Array | ArcCell} arcs 邻接矩阵
// @param {Number} vexnum 图的顶点数
// @param {Number} arcnum 图的弧数
// @constructor
//
class ADGMatrixGraph {
    constructor(vexs, arcs, vexnum, arcnum) {
        // 顶点向量
        this.vexs = vexs || [];
        // 邻接矩阵
        this.arcs = arcs || [];
        // 图的当前顶点数
        this.vexnum = vexnum || 0;
        // 图的当前弧数
        this.arcnum = arcnum || 0;
        // 图的种类标志
        this.kind = DG;
    }

    getVexs() {
        return this.vexs;
    }

    getArcs() {
        return this.arcs;
    }

    getVexNum() {
        return this.vexnum;
    }

    getArcNum() {
        return this.arcnum;
    }

    //
    // 查找顶点
    // @param {*} vp 顶点向量
    // @returns {number}
    //
    locateVex(vp) {
        for (let i = 0; i < this.vexnum; ++i) {
            if (this.vexs[i] === vp) return i;
        }
        return -1;
    }

    //
    // 向图中增加顶点
    // @param {*} vp 顶点向量
    //
    addVertex(vp) {
        if (this.locateVex(vp) !== -1) {
            throw new Error('Vertex has existed!');
        }

        let k = this.vexnum;
        this.vexs[this.vexnum++] = vp;

        let value = 0;
        for (let j = 0; j < this.vexnum; ++j) {
            this.arcs[j] = this.arcs[j] || [];
            this.arcs[k] = this.arcs[k] || [];
            this.arcs[j][k] = this.arcs[j][k] || new ArcCell();
            this.arcs[k][j] = this.arcs[k][j] || new ArcCell();
            this.arcs[j][k].adj = this.arcs[k][j].adj = value;
        }
    }

    //
    // 向图中增加一条弧
    // @param {*} vex1 顶点1向量
    // @param {*} vex2 顶点2向量
    // @param {ArcCell} arc
    // @returns {boolean}
    //
    addArc(vex1, vex2, arc) {
        arc = arc || new ArcCell(1);
        let k = this.locateVex(vex1);
        let j = this.locateVex(vex2);

        if (k === -1 || j === -1) {
            throw new Error('Arc\'s Vertex do not existed!');
        }

        this.arcs[k][j].adj = arc.adj;
        this.arcs[k][j].info = arc.info;

        return true;
    }

    //
    // 删除顶点
    // @param {String} vex 要删除的顶点
    //
    deleteVex(vex) {
        let n = this.vexnum - 1;
        let m = this.locateVex(vex);

        if (m < 0) return false;

        // 将待删除顶点交换到最后一个顶点
        let temp = this.vexs[m];
        this.vexs[m] = this.vexs[n];
        this.vexs[n] = temp;

        // 将边的关系随之交换
        for (let i = 0; i <= n; ++i) {
            this.arcs[i][m] = this.arcs[i][n];
            this.arcs[m][i] = this.arcs[n][i];
        }

        this.arcs[m][m].adj = 0;
        this.vexs.length = --this.vexnum;
        return true;
    }

    // 删除边(v, w)
    // @param {String} v
    // @param {String} w
    // @returns {boolean}
    //
    deleteArc(v, w) {
        let i = this.locateVex(v);
        let j = this.locateVex(w);

        if (i < 0 || j < 0) return false;

        if (this.arcs[i][j].adj) {
            this.arcs[i][j].adj = 0;
            this.arcnum--;
        }

        return true;
    }

    BFSTraverse(visitFn) {
        let visited = [];
        let queue = [];

        for (let k = 0; k < this.vexnum; ++k) {
            visited[k] = false;
        }

        for (let i = 0; i < this.vexnum; ++i) {
            if (!visited[i]) {
                visited[i] = true;
                //visitFn.call(this, i);
                console.log(this.vexs[i]);
                queue.push(i);

                while(queue.length > 0) {
                    let u = queue.shift();

                    for (let j = 0; j < this.vexnum; ++j) {
                        if (this.arcs[u][j].adj !== 0 && !visited[j]) {
                            visited[j] = true;
                            //visitFn.call(this, j);
                            console.log(this.vexs[j]);
                            queue.push(j);
                        }
                    }
                }
            }
        }
    }

    BFSSearch(vex_index) {
        let visited = [];
        let queue = [];

        for (let i = 0; i < this.vexnum; ++i) {
            visited[i] = false;
        }

        if (!(vex_index >= 0 && vex_index < this.vexnum)) {
            throw new Error('vertex not found.');
        }

        queue.push(vex_index);

        let result_array = [];
        result_array.push(vex_index);

        while (queue.length > 0) {
            let u = queue.shift();

            for (let i = 0; i < this.vexnum; ++i) {
                if (this.arcs[u][i].adj !== 0 && !visited[i]) {
                    visited[i] = true;
                    //console.log("BFSSearch found item:", this.vexs[i]);
                    result_array.push(i);
                    queue.push(i);
                }
            }
        }

        return result_array;
    }

    TopSort() {
        let ref = [];
        for (let i = 0; i < this.vexnum; ++i) {
            ref[i] = 0;
        }

        for (let i = 0; i < this.vexnum; ++i) {
            for (let j = 0; j < this.vexnum; ++j) {
                if (this.arcs[i][j].adj !== 0) {
                    ref[j]++;
                }
            }
        }

        let sorted_array = [];

        for (let i = 0; i < this.vexnum; ++i) {
            let s = 0;
            while (s < this.vexnum && ref[s] !== 0) {
                ++s;
            }

            if (s === this.vexnum) break;
            ref[s] = -1;

            //console.log(this.vexs[s]);
            sorted_array.push(s);

            for (let t = 0; t < this.vexnum; ++t) {
                if (this.arcs[s][t].adj !== 0) {
                    --ref[t];
                }
            }
        }

        return sorted_array;
    }

    calculateArcNumOfVexs() {
        for (let i = 0; i < this.vexnum; ++i) {
            this.arcnum_array[i] = 0;
        }

        for (let i = 0; i < this.vexnum; ++i) {
            for (let j = 0; j < this.vexnum; ++j) {
                if (this.arcs[i][j].adj !== 0) {
                    this.arcnum_array[i]++;
                }
            }
        }

        console.log("this.arcnum_array:", this.arcnum_array);
    }
}

export default ADGMatrixGraph;
