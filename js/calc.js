import { init, asunoyozora_wasm } from '../pkg/rust_asunoyozora.js';

async function run() {
    try {
        await init();

        const t_min = 0;
        const t_max = 177;
        const dt = 0.01;
        const tol = 1e-6;
        const h_t = 0.2;
        const h_h = 1.7;
        const m = 50;
        const h_width_rate = 0.24;

        const result = asunoyozora_wasm(t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate);
        console.log('WebAssembly calculation result:', result);
        
        // 結果をDOMに表示
        const resultElement = document.getElementById('simulation-result');
        if (resultElement) {
            resultElement.innerHTML = `<p>計算結果: ${JSON.stringify(result)}</p>`;
        }
    } catch (error) {
        console.error('WebAssembly module error:', error);
        const resultElement = document.getElementById('simulation-result');
        if (resultElement) {
            resultElement.innerHTML = `<p>エラー: ${error.message}</p>`;
        }
    }
}

run();
