#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Objective-C 端的 plugin 註冊樣板。
// Capacitor 對本地（非 npm 安裝的）plugin 必須透過 CAP_PLUGIN 巨集
// 在 ObjC runtime 註冊，否則 Swift 端的 @objc(GazeTrackingPlugin)
// 不會出現在 ObjC class list 中，Capacitor 就會以為 plugin 不存在，
// Web 端會收到 "GazeTracking plugin is not implemented on ios"。
//
// 第二個參數 "GazeTracking" 必須與 web 端
// `registerPlugin<...>('GazeTracking')` 完全一致。
CAP_PLUGIN(GazeTrackingPlugin, "GazeTracking",
    CAP_PLUGIN_METHOD(isSupported, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(start, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
)
