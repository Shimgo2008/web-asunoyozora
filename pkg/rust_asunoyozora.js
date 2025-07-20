import * as wasm_bg from "./rust_asunoyozora_bg.js";

let wasm;

export async function init() {
    if (wasm) return;
    
    try {
        const wasmModule = await WebAssembly.instantiateStreaming(
            fetch('./pkg/rust_asunoyozora_bg.wasm'),
            {
                "./rust_asunoyozora_bg.js": wasm_bg
            }
        );
        wasm = wasmModule.instance;
        wasm_bg.__wbg_set_wasm(wasm);
        
        console.log('WebAssembly module initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WebAssembly module:', error);
        throw error;
    }
}

export function asunoyozora_wasm(t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate) {
    if (!wasm) {
        throw new Error('WebAssembly module not initialized. Call init() first.');
    }
    return wasm_bg.asunoyozora_wasm(t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate);
}

// デフォルトエクスポートとしてinit関数を提供
export default init;