import * as Location from "expo-location";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { MAPTILER_KEY } from "../config";

/*
 * Map that needs no Google API key or billing.
 *
 * It draws OpenStreetMap streets with Leaflet inside a WebView (Esri streets
 * as a backup),
 * and takes the same props the screens already used with react-native-maps:
 * <MapView ref initialRegion showsUserLocation onPress style>, with <Marker>
 * and <Polyline> children, and mapRef.current.animateToRegion(region, ms).
 *
 * Marker colour comes from pinColor, or from the backgroundColor of the
 * marker's custom child view (the facility/bin dots), so pins keep their colours.
 */

export type LatLng = { latitude: number; longitude: number };
export type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };
export type MapPressEvent = { nativeEvent: { coordinate: LatLng } };

export type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
  pinColor?: string;
  draggable?: boolean;
  onPress?: () => void;
  onDragEnd?: (event: MapPressEvent) => void | Promise<void>;
  children?: React.ReactNode;
};

export type PolylineProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
};

// Markers and lines are drawn by the map itself; these only carry props
export function Marker(_props: MarkerProps) {
  return null;
}

export function Polyline(_props: PolylineProps) {
  return null;
}

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  // Accepted so existing screens compile; the web map has no such options
  showsMyLocationButton?: boolean;
  mapType?: string;
  onPress?: (event: MapPressEvent) => void | Promise<void>;
  children?: React.ReactNode;
};

const DEFAULT_REGION: Region = {
  latitude: 10.6765,
  longitude: 122.9509,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Google-style latitudeDelta to a Leaflet zoom level
const deltaToZoom = (delta?: number) => {
  const d = delta && delta > 0 ? delta : 0.02;
  return Math.max(3, Math.min(19, Math.round(Math.log2(360 / d))));
};

// Innermost backgroundColor of a marker's custom child view
const colorFromChildren = (children: React.ReactNode): string | undefined => {
  let found: string | undefined;

  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      const props: any = child.props || {};
      const flat: any = StyleSheet.flatten(props.style) || {};
      if (typeof flat.backgroundColor === "string") {
        found = flat.backgroundColor;
      }
      walk(props.children);
    });
  };

  walk(children);
  return found;
};

type Collected = {
  markers: MarkerProps[];
  lines: PolylineProps[];
};

// Finds <Marker> and <Polyline> anywhere among the children (arrays, fragments, conditionals)
const collectChildren = (children: React.ReactNode): Collected => {
  const result: Collected = { markers: [], lines: [] };

  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === Marker) {
        result.markers.push(child.props as MarkerProps);
      } else if (child.type === Polyline) {
        result.lines.push(child.props as PolylineProps);
      } else if (child.type === React.Fragment) {
        walk((child.props as any).children);
      }
    });
  };

  walk(children);
  return result;
};

// Street map: Esri, then OpenStreetMap as backup
const tileProviders = () => {
  const list: { url: string; attribution: string }[] = [];
  // Esri first: it labels official barangays and streets only
  list.push(
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
    {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
    },
  );
  return list;
};

/*
 * MapTiler answers a bad or over-limit key with an "invalid key" picture
 * instead of a failed load, so the map cannot detect it by itself. Check the
 * key once per app run and only use MapTiler when it really works.
 */
let mapTilerCheck: Promise<boolean> | null = null;

const checkMapTiler = (): Promise<boolean> => {
  if (!MAPTILER_KEY) return Promise.resolve(false);
  if (!mapTilerCheck) {
    mapTilerCheck = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(
          `https://api.maptiler.com/tiles/satellite-v2/0/0/0.jpg?key=${MAPTILER_KEY}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          console.log("MAPTILER KEY CHECK FAILED:", response.status);
        return response.ok;
      } catch (error) {
        console.log("MAPTILER KEY CHECK ERROR:", error);
        return false;
      } finally {
        clearTimeout(timer);
      }
    })();
    // A failed check (e.g. no internet yet) is retried next time a map opens
    mapTilerCheck.then((ok) => {
      if (!ok) mapTilerCheck = null;
    });
  }
  return mapTilerCheck;
};

const buildHtml = (
  region: Region,
  useMapTiler: boolean,
  startSatellite: boolean,
) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e9eee6; }
  .pin { width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
  .leaflet-control-attribution { font-size: 9px; }
  .map-toggle { background: #fff; color: #1b5e20; font: 600 13px sans-serif; padding: 7px 12px;
                border-radius: 18px; box-shadow: 0 1px 5px rgba(0,0,0,.35); border: 0; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function send(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  if (typeof L === "undefined") {
    send({ type: "error", message: "Map library could not load. Check the internet connection." });
  } else {
    var map = L.map("map", { zoomControl: false, attributionControl: true })
      .setView([${region.latitude}, ${region.longitude}], ${deltaToZoom(region.latitudeDelta)});

    // Tile providers in order. If one keeps failing (bad key, limit, outage),
    // the next one takes over, so the map never stays blank.
    var providers = ${JSON.stringify(tileProviders())};
    var current = null;
    var satelliteOn = ${startSatellite};
    function useProvider(index) {
      if (index >= providers.length) return;
      if (current) map.removeLayer(current);
      var errors = 0;
      current = L.tileLayer(providers[index].url, {
        maxZoom: 19,
        attribution: providers[index].attribution
      });
      if (!satelliteOn) current.addTo(map);
      current.on("tileerror", function () {
        errors += 1;
        if (errors === 4) useProvider(index + 1);
      });
    }
    useProvider(0);
    map.attributionControl.setPrefix(false);

    // Satellite view with road and place names: shows real buildings, which
    // makes pinning an exact location easier. MapTiler's imagery is newer and
    // sharper for Bacolod than Esri's (2018); Esri is the backup.
    var esriImageryUrl =
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    var useMapTilerSatellite = ${useMapTiler};
    var satImagery = useMapTilerSatellite
      ? L.tileLayer(
          "https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}",
          {
            maxZoom: 20,
            tileSize: 512,
            zoomOffset: -1,
            attribution: "&copy; MapTiler &copy; OpenStreetMap contributors"
          }
        )
      : L.tileLayer(esriImageryUrl, { maxZoom: 19, attribution: "Imagery &copy; Esri" });
    var satelliteLayer = L.layerGroup([
      satImagery,
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }),
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
    ]);
    var satErrors = 0;
    function watchSatelliteErrors(layer) {
      layer.on("tileerror", function () {
        satErrors += 1;
        if (satErrors !== 4) return;

        if (useMapTilerSatellite) {
          // MapTiler failing (limit, outage): switch to Esri imagery
          useMapTilerSatellite = false;
          satErrors = 0;
          satelliteLayer.removeLayer(satImagery);
          satImagery = L.tileLayer(esriImageryUrl, { maxZoom: 19, attribution: "Imagery &copy; Esri" });
          watchSatelliteErrors(satImagery);
          satelliteLayer.addLayer(satImagery);
          satImagery.bringToBack();
        } else if (satelliteOn) {
          setSatellite(false);
        }
      });
    }
    watchSatelliteErrors(satImagery);

    var toggleButton = null;
    function setSatellite(on) {
      satelliteOn = on;
      if (on) {
        if (current) map.removeLayer(current);
        satelliteLayer.addTo(map);
      } else {
        map.removeLayer(satelliteLayer);
        if (current) current.addTo(map);
      }
      if (toggleButton) toggleButton.textContent = on ? "Map" : "Satellite";
    }

    var ToggleControl = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function () {
        toggleButton = L.DomUtil.create("button", "map-toggle");
        toggleButton.type = "button";
        toggleButton.textContent = satelliteOn ? "Map" : "Satellite";
        L.DomEvent.disableClickPropagation(toggleButton);
        L.DomEvent.on(toggleButton, "click", function () { setSatellite(!satelliteOn); });
        return toggleButton;
      }
    });
    map.addControl(new ToggleControl());
    if (satelliteOn) satelliteLayer.addTo(map);

    var layer = L.layerGroup().addTo(map);
    var userDot = null;

    map.on("click", function (e) {
      send({ type: "press", lat: e.latlng.lat, lng: e.latlng.lng });
    });

    window.updateMap = function (data) {
      layer.clearLayers();

      (data.lines || []).forEach(function (line) {
        L.polyline(line.coords, { color: line.color, weight: line.width, interactive: false }).addTo(layer);
      });

      (data.markers || []).forEach(function (m, i) {
        var marker;
        if (m.draggable) {
          marker = L.marker([m.lat, m.lng], {
            draggable: true,
            icon: L.divIcon({
              className: "",
              html: '<div class="pin" style="background:' + m.color + '"></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 26]
            })
          });
          marker.on("dragend", function () {
            var p = marker.getLatLng();
            send({ type: "dragend", index: i, lat: p.lat, lng: p.lng });
          });
        } else {
          marker = L.circleMarker([m.lat, m.lng], {
            radius: 9,
            color: "#ffffff",
            weight: 2,
            fillColor: m.color,
            fillOpacity: 1,
            bubblingMouseEvents: false
          });
        }
        marker.on("click", function () { send({ type: "marker", index: i }); });
        marker.addTo(layer);
      });
    };

    window.setUserLocation = function (lat, lng) {
      if (!userDot) {
        userDot = L.circleMarker([lat, lng], {
          radius: 8, color: "#ffffff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1, interactive: false
        }).addTo(map);
      } else {
        userDot.setLatLng([lat, lng]);
      }
    };

    window.fitTo = function (points, topLeft, bottomRight, animate) {
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: topLeft,
        paddingBottomRight: bottomRight,
        maxZoom: 17,
        animate: animate
      });
    };

    window.animateTo = function (lat, lng, zoom, ms) {
      map.flyTo([lat, lng], zoom, { duration: Math.max(0.1, (ms || 500) / 1000) });
    };

    send({ type: "ready" });
  }
</script>
</body>
</html>`;

export default class MapView extends React.Component<
  MapViewProps,
  { html: string | null }
> {
  state = { html: null as string | null };
  private unmounted = false;
  private webview: any = null;
  private ready = false;
  private lastSent = "";
  private markers: MarkerProps[] = [];
  private pendingUser: LatLng | null = null;
  private pendingRegion: Region | null = null;
  private locationWatch: { remove: () => void } | null = null;
  componentDidMount() {
    if (this.props.showsUserLocation) this.startUserLocation();

    checkMapTiler().then((useMapTiler) => {
      if (this.unmounted) return;
      this.setState({
        html: buildHtml(
          this.props.initialRegion || DEFAULT_REGION,
          useMapTiler,
          // mapType "satellite" or "hybrid" opens in satellite view (as in react-native-maps)
          this.props.mapType === "satellite" || this.props.mapType === "hybrid",
        ),
      });
    });
  }

  componentDidUpdate() {
    this.syncLayers();
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.locationWatch?.remove();
    this.locationWatch = null;
  }

  // Same signature as react-native-maps
  animateToRegion(region: Region, duration = 500) {
    if (!this.ready) {
      // Map still loading: move there as soon as it is ready
      this.pendingRegion = region;
      return;
    }
    this.run(
      `window.animateTo(${region.latitude}, ${region.longitude}, ${deltaToZoom(
        region.latitudeDelta,
      )}, ${duration});`,
    );
  }

  // Same signature as react-native-maps: zoom so all points are visible
  fitToCoordinates(
    coordinates: LatLng[],
    options?: {
      edgePadding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      animated?: boolean;
    },
  ) {
    if (!this.ready || !coordinates?.length) return;
    const points = JSON.stringify(
      coordinates.map((c) => [c.latitude, c.longitude]),
    );
    const p = options?.edgePadding || {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    };
    this.run(
      `window.fitTo(${points}, [${p.left}, ${p.top}], [${p.right}, ${p.bottom}], ${options?.animated !== false});`,
    );
  }

  private run(js: string) {
    this.webview?.injectJavaScript(`try { ${js} } catch (e) {} true;`);
  }

  private async startUserLocation() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      this.locationWatch = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (pos) => this.showUser(pos.coords),
      );
    } catch (error) {
      console.log("MAP USER LOCATION ERROR:", error);
    }
  }

  private showUser(coords: LatLng) {
    if (!this.ready) {
      this.pendingUser = coords;
      return;
    }
    this.run(
      `window.setUserLocation(${coords.latitude}, ${coords.longitude});`,
    );
  }

  private syncLayers() {
    if (!this.ready) return;

    const collected = collectChildren(this.props.children);
    const lines = collected.lines;
    // Filter first, so a tapped pin's index matches this.markers
    const markers = collected.markers.filter(
      (m) =>
        Number.isFinite(m.coordinate?.latitude) &&
        Number.isFinite(m.coordinate?.longitude),
    );
    this.markers = markers;

    const data = {
      markers: markers.map((m) => ({
        lat: m.coordinate.latitude,
        lng: m.coordinate.longitude,
        color: m.pinColor || colorFromChildren(m.children) || "#d32f2f",
        draggable: Boolean(m.draggable),
      })),
      lines: lines.map((l) => ({
        coords: (l.coordinates || []).map((c) => [c.latitude, c.longitude]),
        color: l.strokeColor || "#1b5e20",
        width: l.strokeWidth || 4,
      })),
    };

    const json = JSON.stringify(data);
    if (json === this.lastSent) return;
    this.lastSent = json;
    this.run(`window.updateMap(${json});`);
  }

  private onMessage = async (event: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (msg.type === "ready") {
      this.ready = true;
      this.lastSent = "";
      this.syncLayers();
      if (this.pendingUser) this.showUser(this.pendingUser);
      if (this.pendingRegion) {
        const region = this.pendingRegion;
        this.pendingRegion = null;
        this.animateToRegion(region, 300);
      }
      return;
    }

    if (msg.type === "error") {
      console.log("MAP ERROR:", msg.message);
      return;
    }

    const coordinate = { latitude: msg.lat, longitude: msg.lng };

    if (msg.type === "press") {
      await this.props.onPress?.({ nativeEvent: { coordinate } });
      return;
    }

    const marker = this.markers[msg.index];
    if (!marker) return;

    if (msg.type === "marker") {
      marker.onPress?.();
    } else if (msg.type === "dragend") {
      await marker.onDragEnd?.({ nativeEvent: { coordinate } });
    }
  };

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.state.html === null ? null : (
          <WebView
            ref={(ref) => {
              this.webview = ref;
            }}
            style={styles.webview}
            originWhitelist={["*"]}
            // baseUrl gives tile requests a real Referer, as OpenStreetMap asks
            source={{
              html: this.state.html,
              baseUrl: "https://erecyclomatch-verified.netlify.app/",
            }}
            onMessage={this.onMessage}
            javaScriptEnabled
            domStorageEnabled
            nestedScrollEnabled
            setSupportMultipleWindows={false}
            overScrollMode="never"
            // Page reloads (e.g. memory pressure) must re-send markers
            onLoadStart={() => {
              this.ready = false;
            }}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", backgroundColor: "#e9eee6" },
  webview: { flex: 1, backgroundColor: "transparent" },
});
