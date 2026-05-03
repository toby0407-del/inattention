export default function Developer() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-100/90 p-4">
      <svg
        viewBox="0 0 1200 720"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 1200, maxHeight: 720 }}
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
          <style>{`
            .title { font: 900 24px "Noto Sans TC", Inter, system-ui, sans-serif; fill: #0f172a; }
            .subZh { font: 800 12px "Noto Sans TC", Inter, system-ui, sans-serif; fill: #334155; letter-spacing: 0.06em; }
            .lbl { font: 900 15px "Noto Sans TC", Inter, system-ui, sans-serif; fill: #0f172a; }
            .item { font: 700 12px "Noto Sans TC", Inter, system-ui, sans-serif; fill: #1e293b; }
            /* 四區主色區分 */
            .box-entry {
              fill: #eef2ff; stroke: #6366f1; stroke-width: 2.5; rx: 24; filter: url(#shadow);
            }
            .box-context {
              fill: #fffbeb; stroke: #d97706; stroke-width: 2.5; rx: 24; filter: url(#shadow);
            }
            .box-child {
              fill: #ecfdf5; stroke: #059669; stroke-width: 2.5; rx: 24; filter: url(#shadow);
            }
            .box-parent {
              fill: #e0f2fe; stroke: #0284c7; stroke-width: 2.5; rx: 24; filter: url(#shadow);
            }
            .tile-entry { fill: #ffffffcc; stroke: #a5b4fc; stroke-width: 1.5; rx: 16; }
            .tile-context { fill: #ffffffcc; stroke: #fcd34d; stroke-width: 1.5; rx: 16; }
            .tile-child { fill: #ffffffcc; stroke: #6ee7b7; stroke-width: 1.5; rx: 16; }
            .tile-parent { fill: #ffffffcc; stroke: #7dd3fc; stroke-width: 1.5; rx: 16; }
            .line { stroke: #475569; stroke-width: 2.75; fill: none; opacity: 0.85; }
            .arrow { fill: #475569; opacity: 0.9; }
          `}</style>
        </defs>

        <rect x="0" y="0" width="1200" height="720" fill="url(#bg)" />

        <text x="64" y="62" className="title">系統架構</text>
        <text x="64" y="92" className="subZh">螢幕流程 · 資料與角色的關係</text>

        {/* 入口 */}
        <rect x="64" y="130" width="320" height="190" className="box-entry" />
        <text x="96" y="168" className="lbl">入口</text>
        <text x="96" y="196" className="subZh">角色選擇</text>
        <text x="96" y="228" className="item">· / SplashScreen（角色／身分）</text>
        <text x="96" y="254" className="item">· 家長／治療師（PIN 1234）</text>
        <text x="96" y="280" className="item">· 開發者（PIN 0000）</text>

        {/* 共用狀態 */}
        <rect x="64" y="352" width="320" height="298" className="box-context" />
        <text x="96" y="390" className="lbl">共用狀態</text>
        <text x="96" y="418" className="subZh">Context · 全域</text>
        <text x="96" y="448" className="item">· AppContext：進度、收藏與訓練參數</text>
        <text x="96" y="474" className="item">· collectedLevelIds：每關收集物解鎖</text>
        <text x="96" y="500" className="item">· distractorLevel、toleranceThreshold 等</text>

        {/* 小勇士端 */}
        <rect x="440" y="130" width="330" height="520" className="box-child" />
        <text x="472" y="168" className="lbl">小勇士端</text>
        <text x="472" y="196" className="subZh">兒童訓練流程</text>

        <rect x="472" y="218" width="266" height="86" className="tile-child" />
        <text x="492" y="246" className="item">/child/lobby｜QuestMap</text>
        <text x="492" y="272" className="item">· 黃道星圖、圖鑑與十二星座進度</text>

        <rect x="472" y="318" width="266" height="86" className="tile-child" />
        <text x="492" y="346" className="item">/child/play｜Gameplay</text>
        <text x="492" y="372" className="item">· 故事開場、暫停／退出與題型</text>

        <rect x="472" y="418" width="266" height="86" className="tile-child" />
        <text x="492" y="446" className="item">/child/reward｜Reward</text>
        <text x="492" y="472" className="item">· 通關後結算與星星／鼓勵</text>

        <rect x="472" y="518" width="266" height="114" className="tile-child" />
        <text x="492" y="546" className="item">BGM／音效</text>
        <text x="492" y="572" className="item">· 環境音與使用者手勢後播放</text>
        <text x="492" y="598" className="item">（WebAudio）</text>

        {/* 家長／臨床端 */}
        <rect x="828" y="130" width="308" height="520" className="box-parent" />
        <text x="860" y="168" className="lbl">家長／臨床端</text>
        <text x="860" y="196" className="subZh">報告與設定</text>

        <rect x="860" y="218" width="244" height="110" className="tile-parent" />
        <text x="880" y="246" className="item">/parent｜Dashboard</text>
        <text x="880" y="272" className="item">· 儀表與概要（可依日／週／月）</text>
        <text x="880" y="296" className="item">（示意／依產品實際欄位）</text>

        <rect x="860" y="348" width="244" height="130" className="tile-parent" />
        <text x="880" y="378" className="item">/parent/analytics</text>
        <text x="880" y="404" className="item">· 訓練成效視覺化</text>
        <text x="880" y="430" className="item">· 熱力圖與分數占比（示範數據）</text>

        <rect x="860" y="498" width="244" height="132" className="tile-parent" />
        <text x="880" y="526" className="item">/parent/settings｜校正</text>
        <text x="880" y="552" className="item">· 視距鎖、分心容忍</text>
        <text x="880" y="578" className="item">· 干擾強度多分級／眼動校正</text>
        <text x="880" y="604" className="item">（右欄快照與分數環圖）</text>

        {/* 連線 */}
        <path d="M384 225 C 408 225, 418 225, 438 227" className="line" />
        <polygon points="440,227 427,219 427,235" className="arrow" />

        <path d="M384 500 C 408 500, 418 500, 438 502" className="line" />
        <polygon points="440,502 427,494 427,510" className="arrow" />

        <path d="M770 362 C 796 362, 808 362, 826 364" className="line" />
        <polygon points="828,364 815,356 815,372" className="arrow" />
      </svg>
    </div>
  );
}
