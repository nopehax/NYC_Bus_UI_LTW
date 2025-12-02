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

type Mode = "vehRef" | "line";

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

  const [mode, setMode] = useState<Mode>("vehRef");
  const [selectedVehRef, setSelectedVehRef] = useState("");
  const [selectedLineName, setSelectedLineName] = useState("");

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

      // Optional: preselect first values
      if (vehRefList.length > 0) {
        setSelectedVehRef(vehRefList[0]);
      }
      if (lineNameList.length > 0) {
        setSelectedLineName(lineNameList[0]);
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

        <div className="map-container">
          <BusTripMap
            data={tripData}
            isTripLoading={isTripLoading}
          />
        </div>
      </div>
    </div>
  );
}
