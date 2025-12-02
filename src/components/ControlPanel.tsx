// src/components/ControlPanel.tsx

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

    return (
        <div className="sidebar">
            <h1 className="app-title">NYC Bus Trip Explorer</h1>

            <div
                className={`server-status server-status-${serverStatus}`}
            >
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
                    <select
                        className="select"
                        value={selectedVehRef}
                        onChange={(e) =>
                            onSelectedVehRefChange(e.target.value)
                        }
                        disabled={
                            isListsLoading || vehRefs.length === 0
                        }
                    >
                        <option value="">
                            {vehRefs.length === 0
                                ? "No vehicle refs available"
                                : "Select a VehicleRef"}
                        </option>
                        {vehRefs.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                )}

                {mode === "line" && (
                    <select
                        className="select"
                        value={selectedLineName}
                        onChange={(e) =>
                            onSelectedLineNameChange(e.target.value)
                        }
                        disabled={
                            isListsLoading || lineNames.length === 0
                        }
                    >
                        <option value="">
                            {lineNames.length === 0
                                ? "No line names available"
                                : "Select a line (e.g. Bx2)"}
                        </option>
                        {lineNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
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
                            Choose a vehicle or line to see its route on
                            the map.
                        </p>
                    )}
            </section>
        </div>
    );
}
