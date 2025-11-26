const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Canvas のサイズを自動調整
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 初期表示
ctx.fillStyle = "lightgray";
ctx.fillRect(0, 0, canvas.width, canvas.height);
