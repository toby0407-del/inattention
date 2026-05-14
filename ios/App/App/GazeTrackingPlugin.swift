import Foundation
import Capacitor
import ARKit

/// 透過 ARKit `ARFaceTrackingConfiguration` + `ARFaceAnchor.lookAtPoint`
/// 取得 3D 視線資料，並透過 Capacitor `notifyListeners` 推到 Web 端。
///
/// 與 Web 端 `getUserMedia` 互斥：呼叫 `start()` 後，Web 端不可同時開鏡頭。
///
/// 註冊機制：本檔搭配 `GazeTrackingPlugin.m` 中的 `CAP_PLUGIN` 巨集向
/// Capacitor 註冊。本地（非 npm）plugin 必須走 `.m` 巨集這條路，否則
/// Capacitor 端會回應 "plugin is not implemented on ios"。
@objc(GazeTrackingPlugin)
public class GazeTrackingPlugin: CAPPlugin, ARSessionDelegate {

    // MARK: - State

    private var arSession: ARSession?
    private let sessionQueue = DispatchQueue(label: "com.inattention.gaze.session")
    private var lastEmitTimestamp: TimeInterval = 0
    /// 最高送往 Web 的頻率，避免淹沒 IPC（30 Hz）
    private let emitIntervalSeconds: TimeInterval = 1.0 / 30.0

    // MARK: - Plugin methods

    @objc func isSupported(_ call: CAPPluginCall) {
        let supported = ARFaceTrackingConfiguration.isSupported
        // ARKit 不直接告訴你裝置有沒有 TrueDepth，
        // 但 A12+ 機型若沒 TrueDepth，face tracking 用單眼鏡頭 + ML 推估深度，精度較差。
        // 這裡先粗略傳出 supported；實際機型分辨由 web 端用 Device 資訊判斷。
        call.resolve([
            "supported": supported
        ])
    }

    @objc func start(_ call: CAPPluginCall) {
        guard ARFaceTrackingConfiguration.isSupported else {
            call.reject("ARFaceTrackingConfiguration is not supported on this device")
            return
        }
        DispatchQueue.main.async {
            if self.arSession != nil {
                call.resolve()
                return
            }
            let configuration = ARFaceTrackingConfiguration()
            configuration.maximumNumberOfTrackedFaces = 1
            configuration.isLightEstimationEnabled = false
            configuration.providesAudioData = false
            if #available(iOS 13.0, *) {
                configuration.isWorldTrackingEnabled = false
            }
            let session = ARSession()
            session.delegate = self
            session.delegateQueue = self.sessionQueue
            session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
            self.arSession = session
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.arSession?.pause()
            self.arSession = nil
            call.resolve()
        }
    }

    // MARK: - ARSessionDelegate

    public func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            guard let faceAnchor = anchor as? ARFaceAnchor else { continue }
            emitGazeUpdate(faceAnchor: faceAnchor)
        }
    }

    public func session(_ session: ARSession, didFailWithError error: Error) {
        notifyListeners("gazeError", data: [
            "message": error.localizedDescription
        ])
    }

    public func sessionWasInterrupted(_ session: ARSession) {
        notifyListeners("gazeInterruption", data: ["interrupted": true])
    }

    public func sessionInterruptionEnded(_ session: ARSession) {
        notifyListeners("gazeInterruption", data: ["interrupted": false])
        // 中斷結束後重置 tracking，以避免座標飄移
        if let configuration = session.configuration {
            session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        }
    }

    // MARK: - Helpers

    private func emitGazeUpdate(faceAnchor: ARFaceAnchor) {
        let now = Date().timeIntervalSince1970
        if now - lastEmitTimestamp < emitIntervalSeconds { return }
        lastEmitTimestamp = now

        // lookAtPoint 在「臉部座標系」：原點在頭中央，y 向上、x 向右、z 朝前（朝相機）
        let lookAtFace = faceAnchor.lookAtPoint  // SIMD3<Float>

        // 把 lookAt 轉到世界座標（ARKit session 啟動時的相機座標系）
        let lookAtH = faceAnchor.transform * SIMD4<Float>(lookAtFace.x, lookAtFace.y, lookAtFace.z, 1.0)
        let lookAtWorld = SIMD3<Float>(lookAtH.x, lookAtH.y, lookAtH.z)

        // 兩眼 transform（4×4），第 4 column 為位置
        let leftEyeLocal = faceAnchor.leftEyeTransform.columns.3
        let rightEyeLocal = faceAnchor.rightEyeTransform.columns.3
        let leftEyeWorld4 = faceAnchor.transform * leftEyeLocal
        let rightEyeWorld4 = faceAnchor.transform * rightEyeLocal

        let payload: [String: Any] = [
            "isTracked": faceAnchor.isTracked,
            "lookAtFace": [
                "x": lookAtFace.x,
                "y": lookAtFace.y,
                "z": lookAtFace.z,
            ],
            "lookAtWorld": [
                "x": lookAtWorld.x,
                "y": lookAtWorld.y,
                "z": lookAtWorld.z,
            ],
            "leftEyeWorld": [
                "x": leftEyeWorld4.x,
                "y": leftEyeWorld4.y,
                "z": leftEyeWorld4.z,
            ],
            "rightEyeWorld": [
                "x": rightEyeWorld4.x,
                "y": rightEyeWorld4.y,
                "z": rightEyeWorld4.z,
            ],
            "faceTransform": flatten(faceAnchor.transform),
            "timestamp": now * 1000.0,
        ]
        notifyListeners("gazeUpdate", data: payload)
    }

    private func flatten(_ m: simd_float4x4) -> [Float] {
        return [
            m.columns.0.x, m.columns.0.y, m.columns.0.z, m.columns.0.w,
            m.columns.1.x, m.columns.1.y, m.columns.1.z, m.columns.1.w,
            m.columns.2.x, m.columns.2.y, m.columns.2.z, m.columns.2.w,
            m.columns.3.x, m.columns.3.y, m.columns.3.z, m.columns.3.w,
        ]
    }
}
