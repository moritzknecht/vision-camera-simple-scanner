#ifndef VisionCameraSimpleScanner_h
#define VisionCameraSimpleScanner_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface VisionCameraSimpleScanner : RCTEventEmitter <RCTBridgeModule>
+ (NSString*)name;
@end

#endif /* VisionCameraSimpleScanner_h */
