import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  TextPath,
  matchFont,
  vec,
  type SkPoint,
} from '@shopify/react-native-skia';
import React, { useState, type FunctionComponent } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  type Barcode,
  type Highlight,
  type Point,
} from 'vision-camera-simple-scanner';

type CameraHighlightsProps = {
  highlights: Highlight[];
  color?: string;
  style?: StyleProp<ViewStyle>;
  debug?: boolean;
  fuzzyDistance?: number;
  onBarcodeTapped?: (barcode: Barcode) => void;
};
// Simple camera highlight renderer, boxes will be aligned along cardinal direction
export const SkiaCameraHighlights: FunctionComponent<CameraHighlightsProps> = ({
  highlights,
  color,
  style,
  debug,
  fuzzyDistance = 15,
  onBarcodeTapped,
}) => {
  // For debugging purposes
  const [lastTap, setLastTap] = useState<SkPoint>();

  return (
    <>
      <Canvas style={[StyleSheet.absoluteFill, style]}>
        {highlights.map(({ key, ...props }) => (
          <AdvancedCameraHighlight
            debug={debug}
            key={key}
            color={color}
            {...props}
          />
        ))}
        {debug && (
          <Circle
            cx={lastTap?.x}
            cy={lastTap?.y}
            r={fuzzyDistance}
            color="lightblue"
          />
        )}
      </Canvas>
      <Pressable
        style={[StyleSheet.absoluteFill, style]}
        onPress={(event) => {
          const { pageX, pageY, locationX, locationY } = event.nativeEvent;
          setLastTap(vec(locationX, locationY));
          console.log(
            `tapped coordinate pageX:${pageX} pageY:${pageY} locationX:${locationX} locationY:${locationY}`,
          );
          const point = { x: locationX, y: locationY };

          const hitCalcResults = highlights.map((each) => ({
            result: each,
            intersections: pointIntersectsPolygon(
              point,
              each.cornerPoints,
              fuzzyDistance,
            ),
          }));

          // Got lucky! Tap was directly inside of a polygon
          const hit = hitCalcResults
            .filter((each) => each.intersections.isInside)
            .sort(
              (a, b) =>
                a.intersections.hitDistance - b.intersections.hitDistance,
            )[0];
          if (hit) {
            console.log(`tapped on barcode ${hit.result.value}`);
            onBarcodeTapped && onBarcodeTapped(hit.result);
            return;
          }

          // Not so lucky, hit was very close to a polygon and this is pretty much Horsehoes (https://en.wikipedia.org/wiki/Horseshoes_(game))
          const fuzzyHit = hitCalcResults
            .filter((each) => each.intersections.hitDistance != fuzzyDistance)
            .sort(
              (a, b) =>
                a.intersections.hitDistance - b.intersections.hitDistance,
            )[0];
          if (fuzzyHit) {
            console.log(`tapped near barcode ${fuzzyHit.result.value}`);
            onBarcodeTapped && onBarcodeTapped(fuzzyHit.result);
            return;
          }
        }}
      />
    </>
  );
};

type CameraHighlightProps = Highlight & {
  debug?: boolean;
  color?: string;
};
export const AdvancedCameraHighlight: FunctionComponent<
  CameraHighlightProps
> = ({ debug, value, cornerPoints, color }) => {
  // Make a full polygon from the list of points
  const polyPoints = cornerPoints.map((p) => vec(p.x, p.y));

  // Build a path for text alignment
  const path = Skia.Path.Make().addPoly(polyPoints, true);

  const font = matchFont({
    fontFamily: 'Helvetica',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: 'normal',
  });

  return (
    <Group color={color}>
      <Path path={path} style="stroke" strokeWidth={4} strokeJoin="round" />
      {debug && (
        <TextPath
          font={font}
          path={path}
          color="hotpink"
          text={value ?? '???'}
        />
      )}
    </Group>
  );
};

// We could use an off-the-shelf library for this, but wheels deserve to be reinvented.
export const pointIntersectsPolygon = (
  test: Point,
  polygon: Point[],
  fuzzyDistance?: number,
) => {
  let isInside = false;

  // Quick bounds calculation to determine if point is near the polygon or not
  let minX = polygon[0].x;
  let maxX = polygon[0].x;
  let minY = polygon[0].y;
  let maxY = polygon[0].y;
  for (let n = 1; n < polygon.length; n++) {
    const q = polygon[n];
    minX = Math.min(q.x, minX);
    maxX = Math.max(q.x, maxX);
    minY = Math.min(q.y, minY);
    maxY = Math.max(q.y, maxY);
  }

  // this will be overwritten by the distance calculations
  let hitDistance = fuzzyDistance as number;

  // Actual out-of-bounds check
  if (test.x < minX || test.x > maxX || test.y < minY || test.y > maxY) {
    // check for close hits before we return
    if (fuzzyDistance) {
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const distanceToCurrentSegment = shortestDistanceToPointFromLine(
          test,
          polygon[i],
          polygon[j],
        );
        if (distanceToCurrentSegment < hitDistance) {
          hitDistance = distanceToCurrentSegment;
        }
      }
    }

    return { isInside, hitDistance };
  }

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    // check for close hits
    if (fuzzyDistance) {
      const distanceToCurrentSegment = shortestDistanceToPointFromLine(
        test,
        polygon[i],
        polygon[j],
      );
      if (distanceToCurrentSegment < hitDistance) {
        hitDistance = distanceToCurrentSegment;
      }
    }

    // TypeScript adaptation of the following C ray intersection function
    // https://web.archive.org/web/20210423034713/https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    // TLDR; counts the number of times a semi-infinite ray intersects a poly boundary, if the number is odd the test point sits inside the polygon.
    if (
      polygon[i].y > test.y !== polygon[j].y > test.y &&
      test.x <
        ((polygon[j].x - polygon[i].x) * (test.y - polygon[i].y)) /
          (polygon[j].y - polygon[i].y) +
          polygon[i].x
    ) {
      isInside = !isInside;
    }
  }

  return { isInside, hitDistance };
};

const distanceBetweenPoints = (a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const shortestDistanceToPointFromLine = (
  point: Point,
  start: Point,
  end: Point,
): number => {
  const lineLength = distanceBetweenPoints(start, end);
  if (lineLength === 0) {
    // If the line is just a point, return distance between the point and the start point
    return distanceBetweenPoints(point, start);
  }

  // Calculate the dot product of the vector from start to point and the vector from start to end
  const dotProduct =
    ((point.x - start.x) * (end.x - start.x) +
      (point.y - start.y) * (end.y - start.y)) /
    Math.pow(lineLength, 2);

  if (dotProduct < 0) {
    // If dotProduct is negative, the projection of point lies outside the line segment towards start
    return distanceBetweenPoints(point, start);
  } else if (dotProduct > 1) {
    // If dotProduct is greater than 1, the projection of point lies outside the line segment towards end
    return distanceBetweenPoints(point, end);
  } else {
    // Calculate the projection point on the line segment
    const projectionX = start.x + dotProduct * (end.x - start.x);
    const projectionY = start.y + dotProduct * (end.y - start.y);
    const projectionPoint: Point = { x: projectionX, y: projectionY };
    // Calculate the distance between the point and its projection on the line segment
    return distanceBetweenPoints(point, projectionPoint);
  }
};
