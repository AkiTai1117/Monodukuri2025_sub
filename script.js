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

            const startIndex = getNodeIndex(startPoint);

            // ① ダイクストラ実行 → dist と prev を取得
            const { dist, prev } = dijkstra(startIndex, graph);

            // ★ すべて再描画
            drawAll();

            const results = [];

            // ② 目的地点それぞれの経路を計算し、ログ & 描画
            goalPoints.forEach((goal, i) => {
                const goalIndex = getNodeIndex(goal);
                const d = dist[goalIndex];

                if (d === Infinity) {
                    console.log(`Goal${i+1}(node ${goalIndex})：到達不可`);
                    return;
                }

                const path = reconstructPath(prev, startIndex, goalIndex);
                console.log(`Goal${i+1} 最短距離=${d}, 経路=${path}`);

                results.push({
                    goalIndex,
                    path,
                    distance: d
                });

                // ★ ここで最短ルートを 1 本だけにする
                const bestRoute = selectShortestRoute(results);

                if (!bestRoute) {
                    console.log("最短ルートが見つかりませんでした");
                    return;
                }

                console.log("最短ゴール:", bestRoute.goalIndex);
                console.log("距離:", bestRoute.distance);
                console.log("ルート:", bestRoute.path);

                // ★ 描画（アニメ or 通常）
                animatePath(bestRoute.path);
                // または drawPath(bestRoute.path);


                // ★最短ルートを赤で描画
                drawPath(path);
            });



            startNode = null;
            endNode = null;
            return;
        }
    }
});

// ダイクストラ法（前ノードも記録して経路復元できるようにする）
function dijkstra(startIndex, graph) {
    const dist = {};
    const visited = {};
    const prev = {}; // ★前ノードの記録
    const pq = [];

    Object.keys(graph).forEach(key => {
        dist[key] = Infinity;
        prev[key] = null;  // 初期化
    });
    dist[startIndex] = 0;

    pq.push({ node: startIndex, cost: 0 });

    while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        const { node: current } = pq.shift();

        if (visited[current]) continue;
        visited[current] = true;

        graph[current].forEach(edge => {
            const next = edge.node;
            const newCost = dist[current] + edge.cost;

            if (newCost < dist[next]) {
                dist[next] = newCost;
                prev[next] = current;  // ★前ノードを記録
                pq.push({ node: next, cost: newCost });
            }
        });
    }

    return { dist, prev };
}


// prev 配列からルートを復元する
function getPath(prev, goalIndex) {
    const path = [];
    let cur = goalIndex;

    while (cur !== null) {
        path.push(cur);
        cur = prev[cur];
    }
    return path.reverse();
}

// 最短ルートをCanvas上に描画する
function drawShortestPath(path) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;

    for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i+1]];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }

    // 描画後、線幅を戻す
    ctx.lineWidth = 2;
    ctx.strokeStyle = "green";
}

// 最短ルートを復元する関数
function reconstructPath(prev, startIndex, goalIndex) {
    let path = [];
    let current = goalIndex;

    while (current !== null) {
        path.unshift(current);  // 前から追加
        if (current == startIndex) break;
        current = prev[current];
    }

    // 始点までたどり着けなかった
    if (path[0] != startIndex) return null;

    return path; // 例: [3, 8, 9, 14]
}

// 最短経路を赤線で描画する
function drawPath(path) {
    if (!path || path.length < 2) return;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "red";

    for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i+1]];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

// 最も短いルートを 1 本だけ選択する
function selectShortestRoute(paths) {
    if (paths.length === 0) return null;

    let best = paths[0];
    for (let p of paths) {
        if (p.distance < best.distance) {
            best = p;
        }
    }
    return best;  // { goalIndex, path, distance }
}

// ----- アニメ制御用（既存のアニメがあればキャンセルできる） -----
let animateId = null;

// 全ライン（緑）を描画（lines[].a/b はノードオブジェクト）
function drawAllLines() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "green";
    for (let l of lines) {
        const a = l.a; // node object
        const b = l.b;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

// 全ノード描画（既存の drawNodes を使えば色も揃う）
function drawAllNodes() {
    drawNodes();
}

// 最短ルートをアニメーション描画する（drawAll() を下地に使う）
// speed: 伸びる速さ px/frame（オプション）
function animatePath(path, speed = 6) {
    if (!path || path.length < 2) return;

    // 既存アニメが走っていたらキャンセル
    if (animateId !== null) {
        cancelAnimationFrame(animateId);
        animateId = null;
    }

    // セグメント配列作成
    const segments = [];
    for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i+1]];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        segments.push({ ax: a.x, ay: a.y, dx, dy, length: len });
    }

    const totalLength = segments.reduce((s,v)=>s+v.length, 0);
    let drawnLength = 0;

    function drawFrame() {
        // 再描画: 背景（ノード＋既存ライン）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAll(); // drawNodes() + all existing green lines

        // 描画する赤線は "drawnLength" に従って部分的に描かれる
        ctx.lineWidth = 4;
        ctx.strokeStyle = "red";

        let remain = drawnLength;
        for (let seg of segments) {
            if (remain <= 0) break;

            const t = Math.min(remain / seg.length, 1);
            ctx.beginPath();
            ctx.moveTo(seg.ax, seg.ay);
            ctx.lineTo(seg.ax + seg.dx * t, seg.ay + seg.dy * t);
            ctx.stroke();

            remain -= seg.length;
        }

        drawnLength += speed;

        if (drawnLength < totalLength) {
            animateId = requestAnimationFrame(drawFrame);
        } else {
            // 最後に全区間を確実に描いて終了
            drawPath(path); // 静的な完全描画（太さ4で描かれる）
            animateId = null;
        }
    }

    // 初回フレームを呼ぶ
    animateId = requestAnimationFrame(drawFrame);
}