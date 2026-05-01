export default function Developer() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <svg
        viewBox="0 0 1200 720"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 1200, maxHeight: 720 }}
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
          <style>{`
            .title { font: 900 22px Inter, system-ui, sans-serif; fill: #0f172a; }
            .sub { font: 800 12px Inter, system-ui, sans-serif; fill: #475569; letter-spacing: 0.4px; }
            .k { font: 800 11px "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", Inter, system-ui, sans-serif; fill: #334155; }
            .box { fill: white; stroke: #e2e8f0; stroke-width: 2; rx: 24; filter: url(#shadow); }
            .box2 { fill: #f8fafc; stroke: #e2e8f0; stroke-width: 2; rx: 24; }
            .line { stroke: #94a3b8; stroke-width: 3; fill: none; }
            .arrow { fill: #94a3b8; }
            .lbl { font: 900 14px Inter, system-ui, sans-serif; fill: #0f172a; }
            .item { font: 700 12px Inter, system-ui, sans-serif; fill: #475569; }
          `}</style>
        </defs>

        <rect x="0" y="0" width="1200" height="720" fill="url(#bg)" />

        <text x="64" y="64" className="title">SYSTEM ARCHITECTURE</text>
        <text x="64" y="92" className="k">시스템 아키텍처 · 화면 흐름</text>

        {/* Entry */}
        <rect x="64" y="130" width="320" height="190" className="box" />
        <text x="96" y="170" className="lbl">入口 / Entry</text>
        <text x="96" y="198" className="k">역할 선택</text>
        <text x="96" y="230" className="item">- / SplashScreen（角色/身分）</text>
        <text x="96" y="256" className="item">- 家長/治療師（PIN 1234）</text>
        <text x="96" y="282" className="item">- 開發者（PIN 0000）</text>

        {/* Child */}
        <rect x="440" y="130" width="330" height="520" className="box" />
        <text x="472" y="170" className="lbl">小勇士端 / Child</text>
        <text x="472" y="198" className="k">훈련 플로우</text>
        <rect x="472" y="220" width="266" height="86" className="box2" />
        <text x="492" y="250" className="item">/child/lobby QuestMap</text>
        <text x="492" y="276" className="item">- 地圖背景分章（依收集物）</text>
        <rect x="472" y="320" width="266" height="86" className="box2" />
        <text x="492" y="350" className="item">/child/play Gameplay</text>
        <text x="492" y="376" className="item">- 故事開場 · 暫停/退出</text>
        <rect x="472" y="420" width="266" height="86" className="box2" />
        <text x="492" y="450" className="item">/child/reward Reward</text>
        <text x="492" y="476" className="item">- 完成後收集本關物品</text>
        <rect x="472" y="520" width="266" height="86" className="box2" />
        <text x="492" y="550" className="item">BGM / Sound</text>
        <text x="492" y="576" className="item">- 青色環境音（WebAudio）</text>

        {/* Parent */}
        <rect x="828" y="130" width="308" height="520" className="box" />
        <text x="860" y="170" className="lbl">醫生端 / Parent</text>
        <text x="860" y="198" className="k">리포트</text>
        <rect x="860" y="220" width="244" height="110" className="box2" />
        <text x="880" y="250" className="item">/parent Dashboard</text>
        <text x="880" y="276" className="item">- 進步曲線（日/週/月）</text>
        <rect x="860" y="350" width="244" height="130" className="box2" />
        <text x="880" y="380" className="item">/parent/analytics</text>
        <text x="880" y="406" className="item">- 訓練成效熱力圖</text>
        <text x="880" y="432" className="item">- 距離 100 的差距</text>
        <rect x="860" y="500" width="244" height="110" className="box2" />
        <text x="880" y="530" className="item">/parent/settings</text>
        <text x="880" y="556" className="item">- 干擾強度（多分級）</text>

        {/* Context */}
        <rect x="64" y="352" width="320" height="298" className="box" />
        <text x="96" y="392" className="lbl">共享狀態 / Context</text>
        <text x="96" y="420" className="k">상태</text>
        <text x="96" y="452" className="item">- AppContext：進度 / 收藏 / 參數</text>
        <text x="96" y="478" className="item">- collectedLevelIds：每關收集物</text>
        <text x="96" y="504" className="item">- distractorLevel / toleranceThreshold</text>

        {/* Lines */}
        <path d="M384 225 C 410 225, 410 225, 440 225" className="line" />
        <polygon points="440,225 428,218 428,232" className="arrow" />

        <path d="M384 500 C 410 500, 410 500, 440 500" className="line" />
        <polygon points="440,500 428,493 428,507" className="arrow" />

        <path d="M770 350 C 800 350, 800 350, 828 350" className="line" />
        <polygon points="828,350 816,343 816,357" className="arrow" />
      </svg>
    </div>
  );
}

