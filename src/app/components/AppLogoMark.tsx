/**
 * 应用程式識別圖（向量）：專注目標環＋核心光點，取代 Emoji 眼珠。
 */
export default function AppLogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      {/* 底色微光 */}
      <circle cx="24" cy="24" r="22" fill="white" fillOpacity={0.2} />
      {/* 外聚焦環 */}
      <circle cx="24" cy="24" r="17" stroke="white" strokeOpacity={0.95} strokeWidth="2.2" />
      {/* 內環 */}
      <circle cx="24" cy="24" r="10.5" stroke="white" strokeOpacity={0.88} strokeWidth="1.75" fill="white" fillOpacity={0.12} />
      {/* 十字對焦線 */}
      <path
        d="M24 6v6M24 36v6M6 24h6M36 24h6"
        stroke="white"
        strokeOpacity={0.9}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 中心光點 */}
      <circle cx="24" cy="24" r="4.2" fill="white" />
      <circle cx="22.3" cy="22.3" r="1.4" fill="white" fillOpacity={0.5} />

      {/* 星座感小星點（呼應產品主題） */}
      <circle cx="11" cy="14" r="1.35" fill="white" fillOpacity={0.75} />
      <circle cx="37" cy="15" r="1.15" fill="white" fillOpacity={0.6} />
      <circle cx="13" cy="36" r="1.05" fill="white" fillOpacity={0.55} />
      <circle cx="35" cy="34" r="1.25" fill="white" fillOpacity={0.65} />
    </svg>
  );
}
