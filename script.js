//canvasの設定
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// ノード（点）を格子状に配置する
const nodes = [];  // ノード配列
const rows = 4;   // 行数
const cols = 5;   // 列数
const spacing = 80; // ノード間の間隔
const lines = []; // 描画された線を格納する配列


// 線描画用の変数
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// 開始ノードと終了ノードを格納する変数
let startNode = null;
let endNode = null;

// モード選択用変数
let mode = "start"; // デフォルトは初期地点設定

// 初期地点と目的地点を格納する変数
let startPoint = null;      // 初期地点（1つ）
let goalPoints = [];        // 目的地点（複数）


document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
        mode = e.target.value;
    });
});


// Canvas のサイズを自動調整
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ノードを生成する関数
function createNodes() {
    nodes.length = 0;
    const startX = 50;
    const startY = 50;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = startX + c * spacing;
            const y = startY + r * spacing;
            nodes.push({ x, y });
        }
    }
}

// ノードを描画する
function drawNodes() {
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);

        // --- 優先順位 ---
        // 1. 線を引くときの startNode / endNode
        // 2. 初期地点・目的地点
        // 3. 通常ノード

        if (node === startNode) {
            ctx.fillStyle = "red";       // 線引き：始点
        }
        else if (node === endNode) {
            ctx.fillStyle = "blue";      // 線引き：終点
        }
        else if (node === startPoint) {
            ctx.fillStyle = "orange";    // 初期地点
        }
        else if (goalPoints.includes(node)) {
            ctx.fillStyle = "purple";    // 目的地点
        }
        else {
            ctx.fillStyle = "black";     // 通常ノード
        }

        ctx.fill();
    });
}



// ノードをクリックしたかどうかの判断
function getClickedNode(mouseX, mouseY) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {  // 半径誤差
            return node;
        }
    }
    return null;
}

// 直線の描画
function drawLineBetweenNodes(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.stroke();
}

// すべてを再描画する関数
function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ノードを描画
    drawNodes();

    // ★ 保存してある過去の線を再描画
    lines.forEach(line => {
        drawLineBetweenNodes(line.a, line.b);
    });
}

// ノードのインデックスを取得する関数
function getNodeIndex(node) {
    return nodes.indexOf(node); // nodeオブジェクトの参照で検索
}

// 接続リストを構築する関数
function buildGraph() {
    const graph = {};

    // ノード数分空の配列を作成
    nodes.forEach((_, idx) => {
        graph[idx] = [];
    });

    // lines を走査して接続関係を graph に追加
    lines.forEach(line => {
        const a = getNodeIndex(line.a);
        const b = getNodeIndex(line.b);

        if (a !== -1 && b !== -1) {
            graph[a].push({ node: b, cost: line.dist });
            graph[b].push({ node: a, cost: line.dist });// 無向グラフなので双方向
        }
    });

    return graph;
}

// グラフ探索アルゴリズム（BFS）で接続を確認する関数
function isConnected(startNode, targetNode, graph) {
    const startIndex = getNodeIndex(startNode);
    const targetIndex = getNodeIndex(targetNode);

    const visited = new Set();
    const queue = [startIndex];

    while (queue.length > 0) {
        const current = queue.shift();

        if (current === targetIndex) return true;

        graph[current].forEach(next => {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        });
    }

    return false;
}



// 初期表示
ctx.fillStyle = "lightgray";
ctx.fillRect(0, 0, canvas.width, canvas.height);
createNodes();
drawNodes();

// ノード間の線を描画する関数
canvas.addEventListener("click", function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = getClickedNode(x, y);
    if (!clickedNode) return;

    // === モード別の動作 ===
    if (mode === "start") {
        // ★ 初期地点は上書き
        startPoint = clickedNode;
        drawAll();
        return;
    }

    if (mode === "goal") {
        // ★ 目的地点は複数可・同じノードを押すと解除
        const idx = goalPoints.indexOf(clickedNode);

        if (idx === -1) {
            goalPoints.push(clickedNode);  // 追加
        } else {
            goalPoints.splice(idx, 1);     // 解除
        }

        drawAll();
        return;
    }

    if (mode === "path") {
        // ★ 道の線引き処理（従来の startNode / endNode）
        if (!startNode) {
            startNode = clickedNode;
            drawAll();
            return;
        }

        if (!endNode) {
            endNode = clickedNode;

            // 線を保存
            const distance = Math.sqrt(
                Math.pow(startNode.x - endNode.x, 2) +
                Math.pow(startNode.y - endNode.y, 2)
            );

            // 三角関数計算し、整数に丸める（お好みで調整）
            const distRounded = Math.round(distance);

            lines.push({ 
                a: startNode, 
                b: endNode,
                dist: distRounded  // ★距離（重み）を持たせる
            });

            const graph = buildGraph();

            drawAll();
            drawLineBetweenNodes(startNode, endNode);

            const startIndex = getNodeIndex(startPoint);

            // 全ノードへの最短距離を取得
            const distances = dijkstra(startIndex, graph);

            // 目的地点それぞれについて表示
            goalPoints.forEach((goal, i) => {
                const goalIndex = getNodeIndex(goal);
                const d = distances[goalIndex];

                if (d === Infinity) {
                    console.log(`Goal${i+1} (node ${goalIndex}) ：到達不可`);
                } else {
                    console.log(`Goal${i+1} (node ${goalIndex}) ：最短距離 = ${d}`);
                }
            });


            startNode = null;
            endNode = null;
            return;
        }
    }
});

// ダイクストラ法による最短経路探索
function dijkstra(startIndex, graph) {
    const dist = {};
    const visited = {};
    const pq = []; // 優先度付きキュー代用（単純配列）

    // 初期化
    Object.keys(graph).forEach(key => {
        dist[key] = Infinity;
    });
    dist[startIndex] = 0;

    pq.push({ node: startIndex, cost: 0 });

    while (pq.length > 0) {
        // コストが最小のものを取り出す
        pq.sort((a, b) => a.cost - b.cost);
        const { node: current } = pq.shift();

        if (visited[current]) continue;
        visited[current] = true;

        // 隣接ノードを探索
        graph[current].forEach(edge => {
            const next = edge.node;
            const cost = edge.cost;

            const newCost = dist[current] + cost;

            if (newCost < dist[next]) {
                dist[next] = newCost;
                pq.push({ node: next, cost: newCost });
            }
        });
    }

    return dist;
}
