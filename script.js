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
            ctx.fillStyle = "yellow";    // 初期地点
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
            lines.push({ a: startNode, b: endNode });

            drawAll();
            drawLineBetweenNodes(startNode, endNode);

            startNode = null;
            endNode = null;
            return;
        }
    }
});

