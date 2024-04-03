import React, { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevices,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  Templates,
  useBarcodeScanner,
  type Barcode,
} from 'vision-camera-simple-scanner';
import { SkiaCameraHighlights } from './SkiaCameraHighlights';

const DEBUGGING_MODE = false;

export default function App() {
  // Ask for camera permission
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [tappedCode, setTappedCode] = useState<Barcode>();

  // Important note here is that we're deconstructing `highlights` from the hook,
  // which contain the information about this frame's discovered barcodes.
  const { props: cameraProps, highlights } = useBarcodeScanner({
    fps: 30,
    onBarcodeScanned: (barcodes) => {
      'worklet';
      console.log(
        `Scanned ${barcodes.length} codes with values=${JSON.stringify(
          barcodes.map(({ value }) => value),
        )} !`,
      );
    },
  });

  const devices = useCameraDevices();
  const device = devices.find(({ position }) => position === 'back');
  const format = useCameraFormat(device, Templates.FrameProcessingYUV);
  if (!device || !format) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!hasPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Vision Camera needs{' '}
            <Text style={styles.bold}>Camera permission</Text>.{' '}
          </Text>
          <Button
            onPress={requestPermission}
            title="Grant Permission"
            color="#007aff"
          />
        </View>
      ) : (
        <>
          <Camera
            // You're free to do any react-native-vision-camera customization you'd normally do
            enableFpsGraph={DEBUGGING_MODE}
            // orientation="landscape-right"
            // resizeMode="cover"
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!isPaused}
            format={format}
            zoom={2}
            orientation={'landscape-right'}
            {...cameraProps}
          />
          <SkiaCameraHighlights
            // Bring-your-own highlight renderer (or don't!), this is just an example of a Skia renderer
            highlights={highlights}
            color="limegreen"
            debug={DEBUGGING_MODE}
            onBarcodeTapped={(barcode) => setTappedCode(barcode)}
          />
        </>
      )}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.actions}>
        <View style={styles.tappedContainer}>
          <Text
            style={styles.tappedText}
          >{`Tapped code: ${(tappedCode && tappedCode.value) || 'N/A'}`}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setIsPaused((prevIsPaused) => !prevIsPaused);
          }}
          style={styles.pauseButton}
        >
          <Text style={styles.bold}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    margin: 12,
  },
  permissionText: {
    fontSize: 17,
    paddingVertical: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  tappedContainer: {
    backgroundColor: '#333',
    borderRadius: 6,
    padding: 6,
  },
  tappedText: { color: 'white' },
  pauseButton: {
    backgroundColor: 'white',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
  },
  actions: {
    backgroundColor: '#3337',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
