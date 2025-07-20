let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
    console.log('WebAssembly instance set:', wasm);
    console.log('Available exports:', Object.keys(wasm.exports));
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (!wasm || !wasm.exports || !wasm.exports.memory) {
        throw new Error('WebAssembly memory not available');
    }
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.exports.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (!wasm || !wasm.exports || !wasm.exports.memory) {
        throw new Error('WebAssembly memory not available');
    }
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.exports.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.exports.memory.buffer);
    }
    return cachedDataViewMemory0;
}
/**
 * @param {number} t_min
 * @param {number} t_max
 * @param {number} dt
 * @param {number} tol
 * @param {number} h_t
 * @param {number} h_h
 * @param {number} m
 * @param {number} h_width_rate
 * @returns {any}
 */
export function asunoyozora_wasm(t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate) {
    console.log('asunoyozora_wasm called with:', { t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate });
    console.log('wasm object:', wasm);
    console.log('wasm.exports:', wasm.exports);
    
    if (!wasm || !wasm.exports || !wasm.exports.__wbindgen_add_to_stack_pointer) {
        throw new Error('WebAssembly module not properly initialized. wasm: ' + wasm + ', exports: ' + (wasm ? wasm.exports : 'undefined'));
    }
    
    try {
        const retptr = wasm.exports.__wbindgen_add_to_stack_pointer(-16);
        wasm.exports.asunoyozora_wasm(retptr, t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.exports.__wbindgen_add_to_stack_pointer(16);
    }
}

export function __wbg_new_405e22f390576ce2() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_new_78feb108b6472713() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_set_3fda3bac07393de4(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

