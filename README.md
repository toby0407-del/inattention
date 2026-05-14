# Authentication and Dashboard Design

1. "找不同"遊戲通關邏輯問題，當所有地方被找到後沒有評分視窗也不會結束。
2. 記憶配對的解答等待時間必須加長。記憶配對遊戲必須找其他圖片，現在太無聊。
3. 記憶配對遊戲時間需有時間限制，時間結束，即用動畫呈現解答。
4. 拼圖遊戲也需要找更多圖片。
5. 若視線沒有看螢幕，需要有提示聲音提醒，並彈出視窗。

This is a code bundle for Authentication and Dashboard Design. The original project is available at https://www.figma.com/design/MK7TPCtbWcBdShlMFrEysk/Authentication-and-Dashboard-Design.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for routing, data model, and QuestMap／圖鑑（含旋轉地球）架構圖（Mermaid）。

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Gemini encouragement (optional)

This project can generate a short encouragement message on the level reward screen using Gemini.

- Create a `.env` file in the project root
- Add:
  - `VITE_GEMINI_API_KEY=YOUR_KEY_HERE`
