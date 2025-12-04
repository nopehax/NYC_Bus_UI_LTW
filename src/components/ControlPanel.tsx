import { useState } from "react";
import Select from "react-select";
import type { SingleValue, InputActionMeta } from "react-select";

type Mode = "vehRef" | "line";

type ControlPanelProps = {
    mode: Mode;
    onModeChange: (mode: Mode) => void;

    vehRefs: string[];
    lineNames: string[];

    selectedVehRef: string;
    onSelectedVehRefChange: (value: string) => void;

    selectedLineName: string;
    onSelectedLineNameChange: (value: string) => void;

    serverStatus: "checking" | "ready" | "error";
    serverError: string | null;

    isListsLoading: boolean;
    listsError: string | null;

    isTripLoading: boolean;
    tripError: string | null;

    onRetryInit: () => void;
};

type Option = { value: string; label: string };

const INITIAL_VISIBLE = 100;
const VISIBLE_STEP = 50;

export function ControlPanel({
    mode,
    onModeChange,
    vehRefs,
    lineNames,
    selectedVehRef,
    onSelectedVehRefChange,
    selectedLineName,
    onSelectedLineNameChange,
    serverStatus,
    serverError,
    isListsLoading,
    listsError,
    isTripLoading,
    tripError,
    onRetryInit,
}: ControlPanelProps) {
    const serverLabel =
        serverStatus === "checking"
            ? "Checking server status…"
            : serverStatus === "ready"
                ? "Server is ready"
                : "Server error";

    // Search text for each dropdown
    const [vehSearch, setVehSearch] = useState("");
    const [lineSearch, setLineSearch] = useState("");

    // How many options to show (lazy rendering)
    const [vehVisibleCount, setVehVisibleCount] = useState(INITIAL_VISIBLE);
    const [lineVisibleCount, setLineVisibleCount] = useState(INITIAL_VISIBLE);

    // Turn raw arrays into Option[]
    const vehOptions: Option[] = vehRefs.map((v) => ({
        value: v,
        label: v,
    }));

    const lineOptions: Option[] = lineNames.map((name) => ({
        value: name,
        label: name,
    }));

    // Currently selected
    const selectedVehOption =
        vehOptions.find((o) => o.value === selectedVehRef) || null;

    const selectedLineOption =
        lineOptions.find((o) => o.value === selectedLineName) || null;

    // ===== Vehicle filtering + lazy slice =====
    const vehQuery = vehSearch.trim().toLowerCase();
    const vehFiltered = vehQuery
        ? vehOptions.filter((o) =>
            o.value.toLowerCase().includes(vehQuery)
        )
        : vehOptions;

    const vehDisplayOptions = vehFiltered.slice(0, vehVisibleCount);
    const vehTotalMatches = vehFiltered.length;

    // ===== Line filtering + lazy slice =====
    const lineQuery = lineSearch.trim().toLowerCase();
    const lineFiltered = lineQuery
        ? lineOptions.filter((o) =>
            o.value.toLowerCase().includes(lineQuery)
        )
        : lineOptions;

    const lineDisplayOptions = lineFiltered.slice(0, lineVisibleCount);
    const lineTotalMatches = lineFiltered.length;

    // ===== Handlers =====
    const handleVehChange = (opt: SingleValue<Option>) => {
        onSelectedVehRefChange(opt?.value ?? "");
    };

    const handleLineChange = (opt: SingleValue<Option>) => {
        onSelectedLineNameChange(opt?.value ?? "");
    };

    // Reset slice when search text changes
    const handleVehInputChange = (
        value: string,
        actionMeta: InputActionMeta
    ) => {
        if (actionMeta.action === "input-change") {
            setVehSearch(value);
            setVehVisibleCount(INITIAL_VISIBLE);
        }
        return value;
    };

    const handleLineInputChange = (
        value: string,
        actionMeta: InputActionMeta
    ) => {
        if (actionMeta.action === "input-change") {
            setLineSearch(value);
            setLineVisibleCount(INITIAL_VISIBLE);
        }
        return value;
    };

    return (
        <>
            <h1 className="overlay-title">NYC Bus Trip Explorer</h1>

            <div className={`server-status server-status-${serverStatus}`}>
                <span>{serverLabel}</span>
                {serverStatus === "error" && (
                    <button
                        className="btn btn-sm"
                        onClick={onRetryInit}
                        type="button"
                    >
                        Retry
                    </button>
                )}
            </div>
            {serverError && (
                <p className="hint error-text">Details: {serverError}</p>
            )}

            <section className="panel-section">
                <h2>Selection mode</h2>
                <div className="mode-toggle">
                    <button
                        type="button"
                        className={`btn toggle ${mode === "vehRef" ? "active" : ""
                            }`}
                        onClick={() => onModeChange("vehRef")}
                    >
                        By Vehicle Ref
                    </button>
                    <button
                        type="button"
                        className={`btn toggle ${mode === "line" ? "active" : ""
                            }`}
                        onClick={() => onModeChange("line")}
                    >
                        By Line Name
                    </button>
                </div>
            </section>

            <section className="panel-section">
                <h2>Pick a {mode === "vehRef" ? "Vehicle" : "Line"}</h2>

                {isListsLoading && (
                    <p className="hint">Loading options from server…</p>
                )}
                {listsError && (
                    <p className="hint error-text">
                        Could not load lists: {listsError}
                    </p>
                )}

                {mode === "vehRef" && (
                    <div style={{ marginTop: 4 }}>
                        <Select<Option, false>
                            classNamePrefix="bus-select"
                            options={vehDisplayOptions}
                            value={selectedVehOption}
                            onChange={handleVehChange}
                            isLoading={isListsLoading}
                            isDisabled={
                                isListsLoading || vehOptions.length === 0
                            }
                            placeholder={
                                vehOptions.length === 0
                                    ? "No vehicle refs available"
                                    : "Search & select a VehicleRef"
                            }
                            isClearable
                            filterOption={null} // we already filter manually
                            onInputChange={handleVehInputChange}
                            onMenuScrollToBottom={() => {
                                setVehVisibleCount((prev) =>
                                    Math.min(prev + VISIBLE_STEP, vehFiltered.length)
                                );
                            }}
                            maxMenuHeight={260}
                        />
                        {vehOptions.length > 0 && (
                            <p className="hint" style={{ marginTop: 4 }}>
                                {vehTotalMatches > vehVisibleCount
                                    ? `Showing ${vehVisibleCount} of ${vehTotalMatches} matches. Scroll to load more.`
                                    : `Found ${vehTotalMatches} vehicle ref${vehTotalMatches !== 1 ? "s" : ""
                                    }.`}
                            </p>
                        )}
                    </div>
                )}

                {mode === "line" && (
                    <div style={{ marginTop: 4 }}>
                        <Select<Option, false>
                            classNamePrefix="bus-select"
                            options={lineDisplayOptions}
                            value={selectedLineOption}
                            onChange={handleLineChange}
                            isLoading={isListsLoading}
                            isDisabled={
                                isListsLoading || lineOptions.length === 0
                            }
                            placeholder={
                                lineOptions.length === 0
                                    ? "No line names available"
                                    : "Search & select a line (e.g. Bx2)"
                            }
                            isClearable
                            filterOption={null}
                            onInputChange={handleLineInputChange}
                            onMenuScrollToBottom={() => {
                                setLineVisibleCount((prev) =>
                                    Math.min(prev + VISIBLE_STEP, lineFiltered.length)
                                );
                            }}
                            maxMenuHeight={260}
                        />
                        {lineOptions.length > 0 && (
                            <p className="hint" style={{ marginTop: 4 }}>
                                {lineTotalMatches > lineVisibleCount
                                    ? `Showing ${lineVisibleCount} of ${lineTotalMatches} matches. Scroll to load more.`
                                    : `Found ${lineTotalMatches} line name${lineTotalMatches !== 1 ? "s" : ""
                                    }.`}
                            </p>
                        )}
                    </div>
                )}
            </section>

            <section className="panel-section">
                <h2>Trip status</h2>
                {isTripLoading && <p className="hint">Loading trip…</p>}
                {tripError && (
                    <p className="hint error-text">
                        Error loading trip: {tripError}
                    </p>
                )}
                {!isTripLoading &&
                    !tripError &&
                    (mode === "vehRef"
                        ? selectedVehRef
                        : selectedLineName) && (
                        <p className="hint">
                            Showing trip for{" "}
                            <strong>
                                {mode === "vehRef"
                                    ? selectedVehRef
                                    : selectedLineName}
                            </strong>
                            .
                        </p>
                    )}
                {!isTripLoading &&
                    !tripError &&
                    !selectedVehRef &&
                    !selectedLineName && (
                        <p className="hint">
                            Choose a vehicle or line to see its route on the map.
                        </p>
                    )}
            </section>
        </>
    );
}
