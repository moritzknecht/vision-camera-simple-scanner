# vision-camera-simple-scanner

## Features

High performance barcode scanner for React Native using VisionCamera.

- **Modern and future-proof:** Built on [react-native-vision-camera@4](https://github.com/mrousavy/react-native-vision-camera) with minimal native dependencies for each platforms to minimize future build-failure risk.

- **Minimal footprint:** Leverages [Google's MLKit BarcodeScanner](https://developers.google.com/android/reference/com/google/mlkit/vision/barcode/package-summary) on Android and [Apple's Vision VNDetectBarcodesRequest](https://developer.apple.com/documentation/vision/vndetectbarcodesrequest).

- **Powerful & Performant:** The implementation has been tailored for advanced use cases where performance is critical. Scanning barcodes is butter smooth at 30fps, and you can customize the detection speed loop (detection fps). Template functionality can provide easy access to high-refresh rate video streams, including 60fps video input on some Android/iOS devices.

- **Hooks based:** Exposes a single, easy-to-use hook [`useBarcodeScanner`](./src/hooks/useBarcodeScanner.ts)

## Demo

![demo](./.github/assets/demo.gif)

A working project can be found at [vision-camera-simple-scanner/example](./example).

## Install

> [!WARNING]
> The project is currently trying to closely track [react-native-vision-camera@4](https://github.com/mrousavy/react-native-vision-camera/releases),
> The latest 2.x releases are made to work with the latest `react-native-vision-camera@4` (currently 4.0.1)
>
> The example application provides a [patch file](./example/patches/react-native-vision-camera+4.0.1.patch) to work around most of the preview-related orientation issues in vision-camera. Since barcode scanning doesn't involve saving photos or video, this patch is only tested to work with previewing photo/video. Use at your own risk.
>
> If you're using JSC instead of hermes, you will need an additional patch to `react-native-worklets-core`. See the [patch file](./example/patches/react-native-worklets-core+1.2.0.patch) in the example project. This patch is not required when using hermes, but as far as I can tell it doesn't cause any issues.

```bash
npm install vision-camera-simple-scanner
# or
yarn add vision-camera-simple-scanner
# or
pnpm add vision-camera-simple-scanner
```

### Dependencies

This package relies on:

- [react-native-vision-camera@>=4](https://github.com/mrousavy/react-native-vision-camera)
- [react-native-worklets-core](https://github.com/margelo/react-native-worklets-core)

You must add them as dependencies to your project:

```bash
npm install react-native-vision-camera react-native-worklets-core
# or
yarn add react-native-vision-camera react-native-worklets-core
# or
pnpm add react-native-vision-camera react-native-worklets-core
```

Then you must follow their respective installation instructions:

- [react-native-worklets-core](https://github.com/margelo/react-native-worklets-core#installation)

## Quickstart

The following quickstart example will dump any discovered codes to the console. For a more in-depth example, which renders the result of the scan on-screen, see the [example project](./example/src).

```tsx
import type { FunctionComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraFormat,
} from 'react-native-vision-camera';
import { useBarcodeScanner, Templates } from 'vision-camera-simple-scanner';

export const App: FunctionComponent = () => {
  // @NOTE you must properly ask for camera permissions first!
  // You should use `PermissionsAndroid` for Android and `Camera.requestCameraPermission()` on iOS.

  // Here's the functionality of this library; configure it for your use case,
  // pass the props to react-native-vision-camera, and you're good to go!
  const { props: cameraProps } = useBarcodeScanner({
    fps: 30,
    barcodeTypes: ['qr', 'ean-13'], // optional
    onBarcodeScanned: (barcodes) => {
      'worklet';
      // this will get called every frame that one or more barcodes are detected
      console.log(
        `Scanned ${barcodes.length} codes with values=${JSON.stringify(
          barcodes.map(({ value }) => value),
        )} !`,
      );
    },
  });

  // Typical react-native-vision-camera setup
  const devices = useCameraDevices();
  const device = devices.find(({ position }) => position === 'back');
  if (!device) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        {...cameraProps}
      />
    </View>
  );
};
```

## Credits

Heavily based on code from

- [mgcrea/vision-camera-barcode-scanner](https://github.com/mgcrea/vision-camera-barcode-scanner)

## Authors

- [Max Gurela](https://github.com/maxpowa) <<mgurela@ptc.com>>

## License

```txt
The MIT License

Copyright (c) 2024 Max Gurela <mgurela@ptc.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
