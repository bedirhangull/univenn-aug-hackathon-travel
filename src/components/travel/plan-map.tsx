import { useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CROWD_COLOR, CROWD_LABEL } from '../../helpers/travel/crowd';
import type { CrowdLevel, TravelPlan } from '../../helpers/travel/types';

/**
 * The plan's stops on a real map.
 *
 * Leaflet in a WebView rather than a native map module: `react-native-maps` and
 * `expo-maps` both need a native rebuild and, on Android, a Google Maps key.
 * `react-native-webview` is already a dependency and OpenStreetMap tiles need
 * no key, so this runs on the existing dev client. Swapping to a native map
 * later only touches this file.
 */

export type MapPoint = {
  name: string;
  day: number;
  lat: number;
  lng: number;
  crowdLevel: CrowdLevel;
  note?: string;
  alternativeTo?: string;
};

/**
 * Fixed light/dark palettes rather than the app's theme tokens. The tokens
 * resolve to oklch(), which older Android WebViews cannot parse, and a map is
 * its own surface anyway — it does not need to match all four accent palettes.
 */
const PALETTE = {
  light: {
    background: '#f4f4f5',
    surface: '#ffffff',
    text: '#18181b',
    subtle: '#71717a',
    border: '#e4e4e7',
    route: '#3f3f46',
  },
  dark: {
    background: '#09090b',
    surface: '#18181b',
    text: '#fafafa',
    subtle: '#a1a1aa',
    border: '#27272a',
    route: '#d4d4d8',
  },
} as const;

/**
 * Standard OpenStreetMap tiles: no key, no account. CARTO's basemap CDN used to
 * serve keyless tiles and now stamps "API KEY REQUIRED" across every one, so it
 * is not an option without signing up.
 *
 * OSM ships no dark raster style, so dark mode filters the light tiles instead
 * of pulling a second tile source. Inverting and rotating the hue turns the
 * land dark and keeps water blue-ish; the pins sit above the filter so their
 * crowd colours stay true.
 */
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const DARK_TILE_FILTER =
  'invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92) saturate(0.75)';

/** Every stop that carries coordinates, tagged with the day it belongs to. */
export const mapPointsFor = (plan: TravelPlan): MapPoint[] =>
  plan.days.flatMap((day) =>
    day.places
      .filter(
        (place): place is typeof place & { lat: number; lng: number } =>
          typeof place.lat === 'number' && typeof place.lng === 'number'
      )
      .map((place) => ({
        name: place.name,
        day: day.day,
        lat: place.lat,
        lng: place.lng,
        crowdLevel: place.crowdLevel,
        note: place.note,
        alternativeTo: place.alternativeTo,
      }))
  );

/** Keeps user-authored text from breaking out of the injected HTML. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function buildHtml(points: MapPoint[], isDark: boolean): string {
  const theme = isDark ? PALETTE.dark : PALETTE.light;

  const safePoints = points.map((point) => ({
    ...point,
    name: escapeHtml(point.name),
    note: point.note ? escapeHtml(point.note) : undefined,
    alternativeTo: point.alternativeTo
      ? escapeHtml(point.alternativeTo)
      : undefined,
  }));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  body { background: ${theme.background}; -webkit-tap-highlight-color: transparent; }
  ${isDark ? `.leaflet-tile-pane { filter: ${DARK_TILE_FILTER}; }` : ''}
  .pin {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 12px/1 -apple-system, system-ui, sans-serif;
    color: #fff; border: 2px solid ${theme.surface};
    box-shadow: 0 2px 8px rgba(0,0,0,.35);
  }
  .leaflet-popup-content-wrapper {
    background: ${theme.surface}; color: ${theme.text};
    border-radius: 14px; box-shadow: 0 6px 24px rgba(0,0,0,.28);
  }
  .leaflet-popup-tip { background: ${theme.surface}; }
  .leaflet-popup-content { margin: 12px 14px; font: 400 13px/1.45 -apple-system, system-ui, sans-serif; }
  .p-name { font-weight: 600; font-size: 14px; letter-spacing: -.2px; }
  .p-meta { color: ${theme.subtle}; font-size: 11.5px; margin-top: 3px; }
  .p-note { margin-top: 6px; color: ${theme.text}; opacity: .8; }
  .p-alt { margin-top: 6px; font-size: 11.5px; color: ${theme.subtle}; border-top: 1px solid ${theme.border}; padding-top: 6px; }
  .leaflet-control-attribution {
    background: ${theme.surface}dd !important; color: ${theme.subtle} !important;
    font-size: 9px !important;
  }
  .leaflet-control-attribution a { color: ${theme.subtle} !important; }
  .leaflet-bar a { background: ${theme.surface}; color: ${theme.text}; border-bottom-color: ${theme.border}; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var CROWD = ${JSON.stringify(CROWD_COLOR)};
  var LABEL = ${JSON.stringify(CROWD_LABEL)};
  var points = ${JSON.stringify(safePoints)};

  var map = L.map('map', { zoomControl: false, attributionControl: true });

  L.tileLayer('${TILE_URL}', {
    maxZoom: 19,
    attribution: '${TILE_ATTRIBUTION}'
  }).addTo(map);

  if (points.length === 0) {
    map.setView([20, 0], 2);
  } else {
    var group = L.featureGroup();

    // A dashed line through the stops in order, so the map reads as a route
    // rather than a scatter of unrelated pins.
    if (points.length > 1) {
      L.polyline(points.map(function (p) { return [p.lat, p.lng]; }), {
        color: '${theme.route}', weight: 1.5, opacity: .55, dashArray: '4 6'
      }).addTo(group);
    }

    points.forEach(function (p) {
      var color = CROWD[p.crowdLevel] || CROWD.moderate;
      var marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="pin" style="background:' + color + '">' + p.day + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      });

      var html = '<div class="p-name">' + p.name + '</div>' +
        '<div class="p-meta">Day ' + p.day + ' &middot; ' + (LABEL[p.crowdLevel] || '') + '</div>' +
        (p.note ? '<div class="p-note">' + p.note + '</div>' : '') +
        (p.alternativeTo ? '<div class="p-alt">Instead of ' + p.alternativeTo + '</div>' : '');

      marker.bindPopup(html);
      group.addLayer(marker);
    });

    group.addTo(map);
    map.fitBounds(group.getBounds().pad(0.28));
  }
</script>
</body>
</html>`;
}

type PlanMapProps = {
  points: MapPoint[];
  isDark: boolean;
};

export const PlanMap = ({ points, isDark }: PlanMapProps) => {
  // Rebuilt only when the pins or the theme change — a new HTML string reloads
  // the WebView, which would throw away the user's pan and zoom.
  const html = useMemo(() => buildHtml(points, isDark), [points, isDark]);

  return (
    <View className="flex-1 overflow-hidden">
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        androidLayerType="hardware"
        // Tiles and the Leaflet bundle are the only network this page needs.
        javaScriptEnabled
        domStorageEnabled={false}
      />
    </View>
  );
};
