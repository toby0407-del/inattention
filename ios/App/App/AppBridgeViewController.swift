import UIKit
import Capacitor

/// 自訂 Capacitor BridgeViewController。
///
/// 本地（非 npm 安裝的）Capacitor plugin 不一定會被 ObjC runtime 自動發現，
/// 即使有 `.m` 檔的 `CAP_PLUGIN` 巨集亦然（會受 Swift class 載入時機影響）。
/// 在這裡顯式呼叫 `bridge?.registerPluginInstance(...)` 是最可靠的補強路徑。
///
/// Storyboard 中 root viewController 已改為使用此 class（customClass +
/// customModule="App" + customModuleProvider="target"）。
@objc(AppBridgeViewController)
class AppBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        NSLog("[gaze] AppBridgeViewController.capacitorDidLoad — registering GazeTrackingPlugin")
        // Capacitor 8: registerPluginInstance(_:) 接收 CAPPlugin instance
        bridge?.registerPluginInstance(GazeTrackingPlugin())
        NSLog("[gaze] GazeTrackingPlugin registered")
    }
}
