import { Platform } from 'react-native';
import type { CameraProps, Frame } from 'react-native-vision-camera';
import type { Barcode, Highlight, PointMapperFn, Size } from 'src/types';
import { computeBoundingBoxFromCornerPoints } from './convert';
import { applyScaleFactor, applyTransformation } from './geometry';

export const computeHighlights = (
  barcodes: Barcode[],
  frame: Pick<Frame, 'width' | 'height' | 'orientation'>,
  layout: Size,
  resizeMode: CameraProps['resizeMode'] = 'cover',
  pointMapper?: PointMapperFn,
): Highlight[] => {
  'worklet';

  // If the layout is not yet known, we can't compute the highlights
  if (layout.width === 0 || layout.height === 0) {
    return [];
  }

  let adjustedLayout = layout;
  if (Platform.OS === 'ios') {
    /* iOS:
     * "portrait" -> "landscape-right"
     * "portrait-upside-down" -> "landscape-left"
     * "landscape-left" -> "portrait"
     * "landscape-right" -> "portrait-upside-down"
     */
    // @NOTE destructure the object to make sure we don't hold a reference to the original layout
    adjustedLayout = ['portrait', 'portrait-upside-down'].includes(
      frame.orientation,
    )
      ? {
          width: layout.height,
          height: layout.width,
        }
      : {
          width: layout.width,
          height: layout.height,
        };
  }

  const highlights = barcodes.map<Highlight>((barcode, index) => {
    const { value, cornerPoints } = barcode;
    let translatedCornerPoints = cornerPoints;

    translatedCornerPoints = translatedCornerPoints?.map((point) =>
      applyScaleFactor(point, frame, adjustedLayout, resizeMode),
    );

    if (pointMapper) {
      translatedCornerPoints = translatedCornerPoints?.map((point) =>
        pointMapper(point, layout, frame.orientation),
      );
    } else {
      translatedCornerPoints = translatedCornerPoints?.map((point) =>
        applyTransformation(point, adjustedLayout, frame.orientation),
      );
    }

    const valueFromCornerPoints = computeBoundingBoxFromCornerPoints(
      translatedCornerPoints!,
    );

    return {
      ...barcode,
      key: `${value}.${index}`,
      cornerPoints: translatedCornerPoints,
      boundingBox: valueFromCornerPoints,
    };
  });
  // console.log(JSON.stringify(highlights, null, 2));

  return highlights;
};
