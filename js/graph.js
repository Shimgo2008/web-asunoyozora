// js/graph.js

export class SFGraph {
    // constructor, init, setupEventListeners, createGrid, createAxes は変更なし
    constructor(containerId, width = 800, height = 400) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found.`);
            return;
        }

        this.width = width;
        this.height = height;
        this.margin = { top: 40, right: 80, bottom: 60, left: 60 };
        this.plotWidth = width - this.margin.left - this.margin.right;
        this.plotHeight = height - this.margin.top - this.margin.bottom;
        
        this.data = { time: [], height: [], velocity: [] };
        this.isAnimating = false;
        this.animationSpeed = 1;
        this.animationFrameId = null;
        this.currentFrame = 0;
        this.totalFrames = 0;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="graph-wrapper">
                <div class="graph-header">FALL SIMULATION DATA</div>
                <div class="legend">
                    <div class="legend-item"><div class="legend-color legend-height"></div><span>Height (m)</span></div>
                    <div class="legend-item"><div class="legend-color legend-velocity"></div><span>Velocity (m/s)</span></div>
                </div>
                <svg class="graph-canvas" width="${this.width}" height="${this.height}">
                    <defs>
                        <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <g class="grid-group"></g>
                    <g class="axes-group"></g>
                    <g class="height-line-group"></g>
                    <g class="velocity-line-group"></g>
                </svg>
                <div class="tooltip" style="display: none;"></div>
            </div>
            <div class="animation-controls">
                <button class="control-btn" id="play-btn">▶ PLAY</button>
                <button class="control-btn" id="pause-btn" disabled>⏸ PAUSE</button>
                <button class="control-btn" id="reset-btn">⏹ RESET</button>
                <button class="control-btn" id="speed-btn">1x</button>
            </div>
        `;
        
        this.svg = this.container.querySelector('.graph-canvas');
        this.tooltip = this.container.querySelector('.tooltip');
        this.playBtn = this.container.querySelector('#play-btn');
        this.pauseBtn = this.container.querySelector('#pause-btn');
        this.resetBtn = this.container.querySelector('#reset-btn');
        this.speedBtn = this.container.querySelector('#speed-btn');

        this.gridGroup = this.container.querySelector('.grid-group');
        this.axesGroup = this.container.querySelector('.axes-group');
        this.heightLineGroup = this.container.querySelector('.height-line-group');
        this.velocityLineGroup = this.container.querySelector('.velocity-line-group');
        
        this.setupEventListeners();
        this.createGrid();
    }
    
    setupEventListeners() {
        this.playHandler = this.play.bind(this);
        this.pauseHandler = this.pause.bind(this);
        this.resetHandler = this.reset.bind(this);
        this.toggleSpeedHandler = this.toggleSpeed.bind(this);
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseLeaveHandler = this.hideTooltip.bind(this);

        this.playBtn.addEventListener('click', this.playHandler);
        this.pauseBtn.addEventListener('click', this.pauseHandler);
        this.resetBtn.addEventListener('click', this.resetHandler);
        this.speedBtn.addEventListener('click', this.toggleSpeedHandler);
        this.svg.addEventListener('mousemove', this.mouseMoveHandler);
        this.svg.addEventListener('mouseleave', this.mouseLeaveHandler);
    }
    
    createGrid() {
        this.gridGroup.innerHTML = '';
        for (let i = 0; i <= 10; i++) {
            const x = this.margin.left + (i / 10) * this.plotWidth;
            this.gridGroup.innerHTML += `<line x1="${x}" y1="${this.margin.top}" x2="${x}" y2="${this.height - this.margin.bottom}" class="grid-line"></line>`;
        }
        for (let i = 0; i <= 8; i++) {
            const y = this.margin.top + (i / 8) * this.plotHeight;
            this.gridGroup.innerHTML += `<line x1="${this.margin.left}" y1="${y}" x2="${this.width - this.margin.right}" y2="${y}" class="grid-line"></line>`;
        }
    }
    
    createAxes() {
        this.axesGroup.innerHTML = '';
        
        this.axesGroup.innerHTML += `<line x1="${this.margin.left}" y1="${this.height - this.margin.bottom}" x2="${this.width - this.margin.right}" y2="${this.height - this.margin.bottom}" class="axis-line"></line>`;
        this.axesGroup.innerHTML += `<line x1="${this.margin.left}" y1="${this.margin.top}" x2="${this.margin.left}" y2="${this.height - this.margin.bottom}" class="axis-line"></line>`;
        this.axesGroup.innerHTML += `<line x1="${this.width - this.margin.right}" y1="${this.margin.top}" x2="${this.width - this.margin.right}" y2="${this.height - this.margin.bottom}" class="axis-line"></line>`;

        for (let i = 0; i <= 5; i++) {
            const x = this.margin.left + (i / 5) * this.plotWidth;
            const time = (i / 5) * this.maxTime;
            this.axesGroup.innerHTML += `<text x="${x}" y="${this.height - this.margin.bottom + 20}" class="axis-label" text-anchor="middle">${time.toFixed(0)}s</text>`;
        }
        
        const heightRange = this.maxHeight - this.minHeight;
        for (let i = 0; i <= 4; i++) {
            const y = this.margin.top + (i / 4) * this.plotHeight;
            const heightVal = this.maxHeight - (i / 4) * heightRange;
            this.axesGroup.innerHTML += `<text x="${this.margin.left - 10}" y="${y + 4}" class="axis-label" text-anchor="end">${(heightVal / 1000).toFixed(1)}km</text>`;
        }
        
        const velocityRange = this.maxVelocity - this.minVelocity;
        for (let i = 0; i <= 4; i++) {
            const y = this.margin.top + (i / 4) * this.plotHeight;
            // [変更点] 速度のラベルも範囲を考慮して正しく計算
            const velocityVal = this.maxVelocity - (i / 4) * velocityRange;
            this.axesGroup.innerHTML += `<text x="${this.width - this.margin.right + 10}" y="${y + 4}" class="axis-label" text-anchor="start">${velocityVal.toFixed(0)}m/s</text>`;
        }
    }

    // [最重要修正点] setDataメソッドをシンプルにする
    setData(timeData, heightData, velocityData) {
        // calc.jsから渡されたデータをそのまま格納する (間引きは行わない)
        this.data = { time: timeData, height: heightData, velocity: velocityData };

        // ★★★ ここにconsole.logを追加（その1） ★★★
        console.log("--- [graph.js] Data received ---");
        console.log(`Received data points: ${this.data.time.length}`);
        
        // 軸のスケールを計算
        this.maxTime = timeData.length > 0 ? timeData[timeData.length - 1] : 1;
        this.maxHeight = heightData.length > 0 ? Math.max(...heightData) : 1;
        this.minHeight = heightData.length > 0 ? Math.min(...heightData) : 0;
        this.maxVelocity = velocityData.length > 0 ? Math.max(...velocityData) : 1;
        this.minVelocity = velocityData.length > 0 ? Math.min(...velocityData) : 0;

        // ★★★ ここにconsole.logを追加（その2） ★★★
        console.log("--- [graph.js] Calculated scales ---");
        console.log(`maxTime: ${this.maxTime}`);
        console.log(`maxHeight: ${this.maxHeight}, minHeight: ${this.minHeight}`);
        console.log(`maxVelocity: ${this.maxVelocity}, minVelocity: ${this.minVelocity}`);
        console.log("-------------------------------------");


        // ゼロ除算を防止
        if (this.maxHeight === this.minHeight) this.maxHeight += 1;
        if (this.maxVelocity === this.minVelocity) this.maxVelocity += 1;

        this.totalFrames = this.data.time.length;
        this.currentFrame = 0;

        this.createAxes();
        this.reset();
    }

    animate() {
        if (!this.isAnimating) return;
        
        const animationDurationMs = 10000 / 10;
        this.currentFrame = Math.min(this.currentFrame + Math.ceil(this.totalFrames / (animationDurationMs / 16) * this.animationSpeed), this.totalFrames - 1);
        
        this.drawCurrentFrame(this.currentFrame);
        
        if (this.currentFrame < this.totalFrames - 1) {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        } else {
            this.pause();
        }
    }

    // [重要修正点] drawCurrentFrameを修正
    drawCurrentFrame(frameIdx) {
        const heightRange = this.maxHeight - this.minHeight;
        const velocityRange = this.maxVelocity - this.minVelocity;
        
        // Y座標を計算するマッパー関数
        const height_y = (val) => this.margin.top + (1 - (val - this.minHeight) / heightRange) * this.plotHeight;
        const vel_y = (val) => this.margin.top + (1 - (val - this.minVelocity) / velocityRange) * this.plotHeight;

        // 描画パスを生成する関数
        const createPath = (data, y_mapper) => {
            let pathData = '';
            // パフォーマンス向上のため、描画点が多い場合は間引く
            const step = Math.max(1, Math.floor(frameIdx / 500)); 
            for (let i = 0; i <= frameIdx; i += step) {
                const x = this.margin.left + (this.data.time[i] / this.maxTime) * this.plotWidth;
                const y = y_mapper(data[i]);
                pathData += (i === 0) ? `M ${x} ${y}` : ` L ${x} ${y}`;
            }
            // 最後の点は必ず描画する
            if (frameIdx > 0 && (frameIdx % step !== 0)) {
                const x = this.margin.left + (this.data.time[frameIdx] / this.maxTime) * this.plotWidth;
                const y = y_mapper(data[frameIdx]);
                pathData += ` L ${x} ${y}`;
            }
            return `<path d="${pathData}" class="data-line"></path>`;
        };

        this.heightLineGroup.innerHTML = `<g class="height-line">${createPath(this.data.height, height_y)}</g>`;
        this.velocityLineGroup.innerHTML = `<g class="velocity-line">${createPath(this.data.velocity, vel_y)}</g>`;
    }
    
    // play, pause, reset, toggleSpeed, handleMouseMove, showTooltip, hideTooltip, destroy は変更なし
    play() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = false;
        if (this.currentFrame >= this.totalFrames - 1) {
            this.currentFrame = 0;
        }
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }
    
    pause() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    reset() {
        this.pause();
        this.currentFrame = 0;
        this.drawCurrentFrame(0);
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    toggleSpeed() {
        const speeds = [1, 2, 4, 0.5];
        this.animationSpeed = speeds[(speeds.indexOf(this.animationSpeed) + 1) % speeds.length];
        this.speedBtn.textContent = `${this.animationSpeed}x`;
    }

    handleMouseMove(e) {
        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const plotX = x - this.margin.left;
        if (plotX < 0 || plotX > this.plotWidth || this.data.time.length === 0) {
            this.hideTooltip();
            return;
        }

        const targetTime = (plotX / this.plotWidth) * this.maxTime;
        
        let index = this.data.time.findIndex(t => t >= targetTime);
        if (index === -1) index = this.data.time.length - 1;

        if (index !== -1) {
            this.showTooltip(e.clientX, e.clientY, index);
        } else {
            this.hideTooltip();
        }
    }
    
    showTooltip(clientX, clientY, index) {
        const time = this.data.time[index];
        const height = this.data.height[index];
        const velocity = this.data.velocity[index];
        
        this.tooltip.innerHTML = `
            <div>Time: ${time.toFixed(2)}s</div>
            <div>Height: ${height.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}m</div>
            <div>Velocity: ${velocity.toFixed(1)}m/s</div>`;
        
        const containerRect = this.container.getBoundingClientRect();
        this.tooltip.style.left = `${clientX - containerRect.left + 15}px`;
        this.tooltip.style.top = `${clientY - containerRect.top}px`;
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    destroy() {
        this.pause();
        if (this.playBtn) {
            this.playBtn.removeEventListener('click', this.playHandler);
            this.pauseBtn.removeEventListener('click', this.pauseHandler);
            this.resetBtn.removeEventListener('click', this.resetHandler);
            this.speedBtn.removeEventListener('click', this.toggleSpeedHandler);
            this.svg.removeEventListener('mousemove', this.mouseMoveHandler);
            this.svg.removeEventListener('mouseleave', this.mouseLeaveHandler);
        }
        this.container.innerHTML = '';
    }
}