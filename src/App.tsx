// src/App.tsx

import { useCallback, useEffect, useState, useRef } from "react";
import {
  checkReady,
  getVehRefs,
  getPubLineNames,
  getTripByVehRef,
  getTripByPubLineName,
  type GeoJsonFeatureCollection,
} from "./api/busApi";
import { BusTripMap } from "./components/BusTripMap";
import { ControlPanel } from "./components/ControlPanel";

const STORAGE_KEY = "nyc-bus-ui-state";
type Mode = "vehRef" | "line";

type PersistedUiState = {
  mode: Mode;
  selectedVehRef: string;
  selectedLineName: string;
};

function loadPersistedState(): PersistedUiState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedUiState>;
    if (!parsed) return null;
    return {
      mode: parsed.mode === "line" ? "line" : "vehRef",
      selectedVehRef: parsed.selectedVehRef ?? "",
      selectedLineName: parsed.selectedLineName ?? "",
    };
  } catch {
    return null;
  }
}

export default function App() {
  const latestRequestIdRef = useRef(0);

  const [serverStatus, setServerStatus] = useState<
    "checking" | "ready" | "error"
  >("checking");
  const [serverError, setServerError] = useState<string | null>(
    null
  );

  const [vehRefs, setVehRefs] = useState<string[]>([]);
  const [lineNames, setLineNames] = useState<string[]>([]);
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(() => {
    const saved = loadPersistedState();
    return saved?.mode ?? "vehRef";
  });
  const [selectedVehRef, setSelectedVehRef] = useState(() => {
    const saved = loadPersistedState();
    return saved?.selectedVehRef ?? "";
  });
  const [selectedLineName, setSelectedLineName] = useState(() => {
    const saved = loadPersistedState();
    return saved?.selectedLineName ?? "";
  });

  const [tripData, setTripData] =
    useState<GeoJsonFeatureCollection | null>(null);
  const [isTripLoading, setIsTripLoading] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const initialise = useCallback(async () => {
    setServerStatus("checking");
    setServerError(null);
    setListsError(null);
    setIsListsLoading(true);

    try {
      const ready = await checkReady();
      if (!ready) {
        setServerStatus("error");
        setServerError("Server responded but is not ready.");
        setIsListsLoading(false);
        return;
      }
      setServerStatus("ready");

      const [vehRefList, lineNameList] = await Promise.all([
        getVehRefs(),
        getPubLineNames(),
      ]);

      setVehRefs(vehRefList);
      setLineNames(lineNameList);
      setIsListsLoading(false);

      // Only fall back to the first option if the current selection is
      // empty OR not found in the new list.
      if (vehRefList.length > 0) {
        setSelectedVehRef((prev) =>
          prev && vehRefList.includes(prev) ? prev : vehRefList[0]
        );
      } else {
        setSelectedVehRef("");
      }

      if (lineNameList.length > 0) {
        setSelectedLineName((prev) =>
          prev && lineNameList.includes(prev) ? prev : lineNameList[0]
        );
      } else {
        setSelectedLineName("");
      }
    } catch (err: any) {
      setServerStatus("error");
      setServerError(
        err?.message || "Failed to contact server."
      );
      setIsListsLoading(false);
    }
  }, []);

  useEffect(() => {
    void initialise();
  }, [initialise]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const toSave: PersistedUiState = {
      mode,
      selectedVehRef,
      selectedLineName,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [mode, selectedVehRef, selectedLineName]);


  useEffect(() => {
    if (serverStatus !== "ready") return;

    const activeId =
      mode === "vehRef" ? selectedVehRef : selectedLineName;

    if (!activeId) {
      setTripData(null);
      setTripError(null);
      return;
    }

    setIsTripLoading(true);
    setTripError(null);

    // mark this request as "the latest"
    const requestId = ++latestRequestIdRef.current;

    const run = async () => {
      try {
        const data =
          mode === "vehRef"
            ? await getTripByVehRef(activeId)
            : await getTripByPubLineName(activeId);

        // if a newer request started after this one, ignore this result
        if (requestId !== latestRequestIdRef.current) return;

        setTripData(data);
      } catch (err: any) {
        if (requestId !== latestRequestIdRef.current) return;

        setTripData(null);
        setTripError(
          err?.message || "Could not load trip data."
        );
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsTripLoading(false);
        }
      }
    };

    void run();
  }, [mode, selectedVehRef, selectedLineName, serverStatus]);


  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setTripError(null);
    setTripData(null);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <span>NYC Bus Trip Explorer</span>
      </header>

      <div className="app-body">
        <div className="map-container">
          <BusTripMap
            data={tripData}
            isTripLoading={isTripLoading}
            overlay={
              <ControlPanel
                mode={mode}
                onModeChange={handleModeChange}
                vehRefs={vehRefs}
                lineNames={lineNames}
                selectedVehRef={selectedVehRef}
                onSelectedVehRefChange={setSelectedVehRef}
                selectedLineName={selectedLineName}
                onSelectedLineNameChange={setSelectedLineName}
                serverStatus={serverStatus}
                serverError={serverError}
                isListsLoading={isListsLoading}
                listsError={listsError}
                isTripLoading={isTripLoading}
                tripError={tripError}
                onRetryInit={initialise}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
