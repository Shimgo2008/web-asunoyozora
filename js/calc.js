// js/calc.js

import { SFGraph } from "./graph.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- UI要素の取得 ---
  const toggleButton = document.getElementById("toggle-button");
  const finishButton = document.getElementById("finish-button");
  const calculateButton = document.getElementById("calculate-button");
  const contentWrapper = document.querySelector(".content-wrapper");
  const toggleIcon = toggleButton.querySelector(".material-symbols-outlined");
  const resultElement = document.getElementById("simulation-result");
  const graphContainer = document.getElementById("graph-container");

  // --- UIイベントリスナーの設定 ---
  toggleButton.addEventListener("click", () => {
    contentWrapper.classList.toggle("hidden");
    toggleIcon.textContent = contentWrapper.classList.contains("hidden") ? "visibility_off" : "visibility";
  });

  // finishButtonのクリックイベント
  // 注: HTML側の <script>let isFinish = false;</script> とは別の変数です。
  // このモジュール内でのみ有効な変数 isFinish を更新します。
  let isFinish = false;
  finishButton.addEventListener("click", () => {
    isFinish = !isFinish;
  });

  // --- WebAssembly & シミュレーションロジック ---
  let asunoyozora_wasm_fn = null;
  let graph = null;

  // WASMの初期化処理を非同期関数としてまとめる
  async function initializeWasm() {
    // [修正点1] UIを「準備中」の状態で初期化
    calculateButton.disabled = true;
    calculateButton.textContent = "準備中...";
    resultElement.innerHTML = "<p>WebAssemblyモジュールを読み込んでいます...</p>";

    try {
      const module = await import("../pkg/rust_asunoyozora.js");
      await module.default(); // WASMモジュールの初期化
      asunoyozora_wasm_fn = module.asunoyozora_wasm; // 関数を代入

      // 関数が正しく取得できたか念のため確認
      if (typeof asunoyozora_wasm_fn !== "function") {
        throw new Error("WASMモジュールは読み込まれましたが、'asunoyozora_wasm'関数が見つかりません。");
      }

      console.log("WebAssembly function is ready.");

      // [修正点2] 成功後、ボタンを有効化し、メッセージを更新
      calculateButton.disabled = false;
      calculateButton.textContent = "シミュレーション実行";
      resultElement.innerHTML = "<p>パラメータを設定して「シミュレーション実行」ボタンを押してください。</p>";
    } catch (error) {
      console.error("Failed to load or initialize WebAssembly module:", error);
      // [修正点3] 失敗時、エラーメッセージを表示してボタンを無効化
      resultElement.innerHTML = `<p class="result-error">WebAssemblyモジュールの読み込みに失敗しました。ブラウザのコンソールで詳細を確認してください。</p>`;
      calculateButton.disabled = true;
      calculateButton.textContent = "WASM読込失敗";
    }
  }

  // WASMの初期化を開始
  initializeWasm();

  calculateButton.addEventListener("click", () => {
    // ボタンがクリックされた時点では関数は存在するはずだが、念のためチェック
    if (!asunoyozora_wasm_fn) {
      resultElement.innerHTML = '<p class="result-error">WebAssemblyモジュールが準備中です。ページをリロードしてみてください。</p>';
      return;
    }

    const t_min = parseFloat(document.getElementById("t-min").value);
    const t_max = parseFloat(document.getElementById("t-max").value);
    const dt = parseFloat(document.getElementById("dt").value);
    const tol = parseFloat(document.getElementById("tol").value);
    const h_t = parseFloat(document.getElementById("h-t").value);
    const h_h = parseFloat(document.getElementById("h-h").value);
    const m = parseFloat(document.getElementById("mass").value);
    const h_width_rate = parseFloat(document.getElementById("h-width-rate").value);

    if ([t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate].some(isNaN)) {
      resultElement.innerHTML = '<p class="result-error">エラー: 全ての入力に有効な数値を入力してください。</p>';
      return;
    }

    resultElement.innerHTML = "<p>計算中...</p>";
    calculateButton.disabled = true;
    calculateButton.textContent = "計算中...";

    // setTimeoutを使ってUIが「計算中」に更新されるのを待ってから重い処理を実行する
    setTimeout(() => {
      try {
        const result = asunoyozora_wasm_fn(t_min, t_max, dt, tol, h_t, h_h, m, h_width_rate);

        // Rustからの戻り値がnullやundefinedでないか確認
        if (!result) {
          throw new Error("シミュレーション結果がWASMから返されませんでした。");
        }

        const initialHeight = result?.[0]?.altitude ?? 0;
        resultElement.innerHTML = `
                    <p class="result-success">計算完了！</p>
                    <p><strong>初期高度: ${initialHeight.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} m</strong></p>
                `;
        updateGraph(result, t_min, dt);
      } catch (error) {
        console.error("WebAssembly calculation error:", error);
        resultElement.innerHTML = `<p class="result-error">計算エラーが発生しました: ${error.message}</p>`;
        graphContainer.style.display = "none";
      } finally {
        // 成功・失敗にかかわらずボタンの状態を元に戻す
        calculateButton.disabled = false;
        calculateButton.textContent = "シミュレーション実行";
      }
    }, 10);
  });


    function updateGraph(result, t_min, dt) {
        if (!result || !Array.isArray(result) || result.length === 0) {
            graphContainer.style.display = 'none';
            return;
        }

        const timeData = [];
        const heightData = [];
        const velocityData = [];

        // [変更点] Rust側で2回に1回間引かれているため、dtを2倍して時間を計算する
        const effective_dt = dt * 2.0; 

        result.forEach((item, i) => {
            // [変更点] インデックスiに掛けるdtを effective_dt に変更
            timeData.push(t_min + i * effective_dt);
            heightData.push(item.altitude ?? 0);
            // 速度は常に正の値（速さ）としてグラフに表示する
            velocityData.push(item.velocity < 0 ? -item.velocity : item.velocity);
        });
        
        // Rustの間引き処理によっては、最後のデータ点が計算上のt_maxとずれる可能性があるため、
        // 最後のデータ点の時間を強制的にt_maxに合わせる（より正確なグラフのため）
        const t_max = parseFloat(document.getElementById('t-max').value);
        if(timeData.length > 0) {
            timeData[timeData.length - 1] = t_max;
        }

        // ★★★ ここにconsole.logを追加 ★★★
        console.log("--- [calc.js] Data sent to graph ---");
        console.log(`Number of data points: ${timeData.length}`);
        console.log(`Last time value: ${timeData[timeData.length - 1]}`);
        console.log(`Max height: ${Math.max(...heightData)}`);
        console.log(`Max velocity: ${Math.max(...velocityData)}`);
        console.log("------------------------------------");

        graphContainer.style.display = 'block';

        if (graph && typeof graph.destroy === 'function') {
            graph.destroy();
        }
        
        graph = new SFGraph('graph-container', 800, 400);
        graph.setData(timeData, heightData, velocityData);
    }
});
