# NYC Bus Trip Viewer – Test Procedures

## 1. Introduction

This document describes the **test procedures** for the NYC Bus Trip Viewer SPA and its backend API.  
It is aligned with the:

- Software Interface Agreement (SIA)
- User Stories US-1 to US-12

The goal is to ensure that:

- The SPA interacts correctly with the backend API.
- The core user-facing functionalities behave as intended.
- Regressions can be quickly detected through repeatable procedures.

---

## 2. Scope

In scope:

- Functional testing of all user-facing features in the SPA:
  - Backend readiness checks
  - Vehicle and line list loading
  - Vehicle/line selection
  - Trip rendering on the map
  - Search/filter in selectors
  - Persistence of last selection
  - Error handling and messaging
- Integration with the backend API endpoints:
  - `/ready`
  - `/getVehRef`
  - `/getPubLineName`
  - `/getBusTripByVehRef/{vehRef}`
  - `/getBusTripByPubLineName/{pubLineName}`

Out of scope (for this document):

- Detailed load/performance testing.
- Security/penetration testing.
- Backend data quality beyond “valid GeoJSON and non-empty lists”.

---

## 3. Test Environment

### 3.1 Software

- **Browser(s):**
  - Latest Chrome (required)
  - Latest Firefox (recommended)
- **SPA deployment:**
  - URL, e.g. `https://<your-frontend-url>/` or `http://localhost:3000`
- **Backend API base URL (as per SIA):**
  - `https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip`  
    (or environment-specific equivalent)

### 3.2 Configuration

- Ensure the frontend is configured with the correct **BASE_URL** for the current environment.
- Ensure CORS is correctly configured on the backend (no CORS-related errors in browser dev tools).

### 3.3 Test Data Assumptions

- `/getVehRef` returns at least several vehicle references (e.g. ≥ 5).
- `/getPubLineName` returns at least several line names (e.g. ≥ 5).
- At least one `vehRef` and one `pubLineName` return:
  - Valid, non-empty GeoJSON FeatureCollection(s).
- At least one test case uses invalid inputs or simulates backend failure (e.g. using a test/staging environment that can be configured to fail).

---

## 4. Test Process Overview

1. **Pre-check:** Validate backend readiness with `/ready`.
2. **List loading:** Validate loading of vehicle and line lists.
3. **Selection tests:** Validate selection in both Vehicle and Line modes.
4. **Search tests:** Validate search/filter behaviour in both lists.
5. **Persistence tests:** Validate that the last selection and mode are preserved across reloads.
6. **Error handling:** Validate behaviour for network/API failures and invalid data.
7. **Regression:** Re-run core tests (US-1 to US-7, US-11, US-12) after changes.

Each test case below includes:

- ID
- Related User Story
- Objective
- Preconditions
- Steps
- Expected Result

---

## 5. Detailed Test Cases

### TP-01 – Backend readiness check

**Related User Story:** US-1, US-2  
**Objective:** Verify that the app checks backend readiness on startup and responds appropriately.

**Preconditions:**

- SPA is deployed and accessible.
- Backend is reachable and correctly configured.

**Steps:**

1. Open the SPA URL in a new browser tab.
2. Observe the initial behaviour of the application.

**Expected Result:**

- The SPA sends a request to `/ready` (confirm via browser dev tools, Network tab).
- If the response is `{"status":"Ready"}` with `200 OK`:
  - The app proceeds to load vehicle and line lists (no error message displayed).
- If the response is non-200 or `status` ≠ `"Ready"`:
  - The app displays an error indicating the server is not ready or unavailable.
  - The app does **not** proceed to request lists or trips.

---

### TP-02 – Handle failure to contact server on startup

**Related User Story:** US-2  
**Objective:** Confirm that the app informs the user when the server cannot be reached.

**Preconditions:**

- Backend is **stopped** or DNS is misconfigured (simulate network failure).
- SPA is deployed and accessible.

**Steps:**

1. With the backend disabled/unreachable, open the SPA URL.
2. Wait for the initial load to complete.

**Expected Result:**

- The app attempts to call `/ready` but fails (network error).
- A clear message is shown indicating the failure, e.g. “Failed to contact server.”
- No lists or map data are loaded.

---

### TP-03 – Load vehicle reference list

**Related User Story:** US-3  
**Objective:** Verify that the vehicle reference list is requested and displayed.

**Preconditions:**

- Backend running and `/ready` returns `{"status":"Ready"}`.
- `/getVehRef` returns a non-empty JSON array of strings.

**Steps:**

1. Open the SPA and confirm it passes the readiness check.
2. Open dev tools → Network.
3. Locate the request to `/getVehRef`.
4. Observe the “Vehicle” selection control in the UI.

**Expected Result:**

- A single `GET /getVehRef` request is made and returns `200 OK`.
- The JSON response is an array of strings.
- The “Vehicle” dropdown displays one option per string in the response.
- If at least one entry is present:
  - Either no selection is chosen by default, **or**
  - The first entry is selected and is visible.

---

### TP-04 – Handle failure when loading vehicle reference list

**Related User Story:** US-3, US-10  
**Objective:** Confirm that errors loading vehicle references are handled gracefully.

**Preconditions:**

- Backend is configured so `/getVehRef` returns a `4xx` or `5xx` status (e.g. temporary test configuration).

**Steps:**

1. Open the SPA (or reload), ensuring readiness still passes.
2. Observe the behaviour after `/getVehRef` is called.

**Expected Result:**

- `GET /getVehRef` returns a non-2xx status.
- The app:
  - Shows an error message derived from the response body where possible, or a generic “Request failed: …” message.
  - Keeps the vehicle selection control disabled or clearly unavailable.
  - Does not crash.

---

### TP-05 – Load public line names list

**Related User Story:** US-4  
**Objective:** Verify that the line names list is requested and displayed.

**Preconditions:**

- Backend running and ready.
- `/getPubLineName` returns a non-empty array of strings.

**Steps:**

1. Open the SPA and ensure it passes readiness.
2. Open dev tools → Network.
3. Locate the `/getPubLineName` request.
4. Observe the “Line” selection control.

**Expected Result:**

- `GET /getPubLineName` is called once and returns `200 OK`.
- The response is a JSON array of strings.
- The “Line” selector is populated with these names.
- If non-empty:
  - Either no line is pre-selected, **or**
  - A sensible default is shown.

---

### TP-06 – Handle failure when loading line names list

**Related User Story:** US-4, US-10  
**Objective:** Confirm that errors loading line names are handled gracefully.

**Preconditions:**

- Backend configured so `/getPubLineName` returns `4xx` or `5xx`.

**Steps:**

1. Open or reload the SPA with backend ready but `/getPubLineName` failing.
2. Observe the UI after the list request.

**Expected Result:**

- The app shows a user-visible error message.
- The line selector remains disabled or clearly unavailable.
- No map data is loaded based on line selection.

---

### TP-07 – Switch between Vehicle and Line modes

**Related User Story:** US-5  
**Objective:** Verify correct behaviour when switching between modes.

**Preconditions:**

- Backend ready; lists for both vehicles and lines are loaded correctly.

**Steps:**

1. Identify the mode toggle (e.g. radio buttons or buttons for “Vehicle” and “Line”).
2. Switch from “Vehicle” mode to “Line” mode.
3. Observe which controls are enabled/disabled.
4. Switch back from “Line” to “Vehicle” mode.

**Expected Result:**

- In “Vehicle” mode:
  - Vehicle selector is enabled/visible.
  - Line selector is disabled or visually de-emphasised.
- In “Line” mode:
  - Line selector is enabled/visible.
  - Vehicle selector is disabled or visually de-emphasised.
- No errors or crashes occur while toggling.
- Map content is only updated when a valid selection is made (not just by switching modes alone).

---

### TP-08 – View trip for selected vehicle

**Related User Story:** US-6, US-8  
**Objective:** Verify that selecting a vehicle loads and displays its trip.

**Preconditions:**

- Backend ready.
- `/getVehRef` returns at least one `vehRef` with valid trip data.

**Steps:**

1. Ensure the app has loaded successfully.
2. Ensure mode is set to “Vehicle”.
3. From the vehicle selector, choose a known valid `vehRef`.
4. Open dev tools → Network and observe the new request.
5. Wait for the response and observe the map.

**Expected Result:**

- The app issues `GET /getBusTripByVehRef/{vehRef}` (with URL-encoded `vehRef`).
- The response is a `200 OK` with a valid GeoJSON FeatureCollection.
- Existing trip display (if any) is cleared.
- The new trip geometry is drawn on the map.
- Map automatically pans/zooms to fully contain the trip path.
- No JavaScript errors are thrown in the console.

---

### TP-09 – Vehicle trip with empty or invalid geometry

**Related User Story:** US-6, US-8, US-10  
**Objective:** Ensure the app handles empty or invalid trip responses for a vehicle.

**Preconditions:**

- Backend configured such that a specific `vehRef` returns:
  - Either an empty FeatureCollection (`features: []`), or
  - A `4xx/5xx` error.

**Steps:**

1. Switch to “Vehicle” mode.
2. Select the `vehRef` configured for this test.
3. Observe behaviour and the map.

**Expected Result:**

- For empty but valid GeoJSON:
  - No route is displayed.
  - Map view is not changed dramatically (no wild zoom).
  - The app does not crash.
  - Optionally, an informational message may inform that no data is available.
- For `4xx/5xx` responses:
  - Error message is shown based on the response text or generic status string.
  - No outdated or partial route is displayed from this failed request.

---

### TP-10 – View trip for selected line

**Related User Story:** US-7, US-8  
**Objective:** Verify that selecting a line loads and displays its trip(s).

**Preconditions:**

- Backend ready.
- `/getPubLineName` returns a line with valid trip data.

**Steps:**

1. Ensure the app has loaded successfully.
2. Switch to “Line” mode.
3. Select a known valid line (`pubLineName`) from the list.
4. Monitor the network call.
5. Observe the map rendering.

**Expected Result:**

- The app issues `GET /getBusTripByPubLineName/{pubLineName}`.
- Response is `200 OK` with GeoJSON FeatureCollection.
- All returned features are rendered on the map.
- The map fits bounds to show all features (lines, multi-lines, etc.).
- No errors in the console.

---

### TP-11 – Line trip error and empty result handling

**Related User Story:** US-7, US-8, US-10  
**Objective:** Ensure the app handles empty or failed trip responses for a line.

**Preconditions:**

- Backend configured with:
  - A `pubLineName` that returns an empty FeatureCollection or error.

**Steps:**

1. Switch to “Line” mode.
2. Select the configured line.
3. Observe the outcome.

**Expected Result:**

- For empty but valid GeoJSON:
  - No route is drawn.
  - No unexpected zoom.
  - Optional “no data” message is acceptable.
- For `4xx/5xx`:
  - An error message is displayed.
  - Existing maps data is not replaced by invalid/partial data from this request.

---

### TP-12 – Auto-fit map on trip load

**Related User Story:** US-8  
**Objective:** Confirm that the map auto-fits to the route for both vehicle and line trips.

**Preconditions:**

- At least one `vehRef` and one `pubLineName` with known valid, visible geometry.

**Steps:**

1. In “Vehicle” mode, select a valid `vehRef`.
2. After the trip is rendered, note the map extent and zoom.
3. Switch to “Line” mode and select a valid `pubLineName` whose route covers a different area.
4. Observe the new map extent.

**Expected Result:**

- After each successful trip load:
  - The map view adjusts to include all geometry from that trip.
  - The user can immediately see the path without panning/zooming.
- No extreme zoom-out (e.g. whole world) occurs unless the geometry genuinely requires it.

---

### TP-13 – Handle rapid selections and concurrent requests

**Related User Story:** US-9  
**Objective:** Verify that only the most recent selection’s data is rendered if multiple requests overlap.

**Preconditions:**

- Backend ready.
- Trips for multiple `vehRef` and `pubLineName` exist.

**Steps:**

1. In “Vehicle” mode, quickly select several different `vehRef` values in rapid succession.
2. Monitor network requests and their completion order.
3. Repeat the same test in “Line” mode with multiple `pubLineName` selections.

**Expected Result:**

- Multiple requests are in-flight and may complete out of order.
- The SPA renders only the trip corresponding to the **last** selection made by the user.
- Earlier, slower responses are ignored and do not overwrite the latest displayed route.
- No console errors are thrown.

---

### TP-14 – Search for a specific vehicle

**Related User Story:** US-11  
**Objective:** Verify search/filter behaviour in the vehicle selector.

**Preconditions:**

- Backend ready.
- `/getVehRef` returns multiple distinct `vehRef` values with identifiable patterns (e.g. `MTA NYCT_1234`, `MTA NYCT_5678`, etc.).

**Steps:**

1. Ensure “Vehicle” mode is active and the list is loaded.
2. Focus the vehicle selector or associated search input.
3. Type a partial string that matches some but not all vehicle references (e.g. `123`).
4. Observe the list of options.
5. Select one of the filtered results.
6. Clear the search input.

**Expected Result:**

- While typing:
  - The list is filtered to only those `vehRef` values whose text contains the search string (case-insensitive).
- On choosing a filtered result:
  - The selected `vehRef` becomes the active value.
  - Trip data is requested and rendered as in TP-08.
- When the search input is cleared:
  - The full original vehicle list is visible again.

---

### TP-15 – Search for a specific line

**Related User Story:** US-11  
**Objective:** Verify search/filter behaviour in the line selector.

**Preconditions:**

- Backend ready.
- `/getPubLineName` returns multiple distinct line names (e.g. `M15`, `M15-SBS`, `BX12`, etc.).

**Steps:**

1. Switch to “Line” mode.
2. Focus the line selector or its search input.
3. Type partial text that matches some but not all lines (e.g. `M15`).
4. Observe the filtered options.
5. Select a matching line and verify trip loading.
6. Enter a random string that matches no lines (e.g. `ZZZ123`).

**Expected Result:**

- Matching text filters the list to only relevant line names.
- Selecting a filtered line loads its trip normally (TP-10).
- For a query with no matches:
  - The UI shows an empty state with something like “No matching lines”.
  - No invalid selection can be made.
- Clearing the search input restores the full line list.

---

### TP-16 – Persist vehicle/line selection & mode across reloads

**Related User Story:** US-12  
**Objective:** Ensure that the last selection and mode are preserved after reloading the page in the same browser.

**Preconditions:**

- Backend ready.
- Browser storage (e.g. `localStorage`) is enabled.

**Steps:**

1. In “Vehicle” mode, select a specific `vehRef` and confirm its trip is displayed.
2. Reload the page (F5 or browser reload button).
3. Observe the mode and selected `vehRef`, and whether a trip is automatically loaded.
4. Switch to “Line” mode and select a line.
5. Confirm its trip is displayed.
6. Reload the page again.
7. Observe the mode and selection.

**Expected Result:**

- After the first reload:
  - The app starts in “Vehicle” mode.
  - The previously selected `vehRef` is pre-selected (assuming it still exists in the list).
  - Trip data for that `vehRef` is automatically requested and rendered.
- After the second reload (following line selection):
  - The app starts in “Line” mode.
  - The previously selected line is pre-selected (if still available).
  - The line’s trip data is automatically loaded.
- The user does not need to re-select their last choice after each reload.

---

### TP-17 – Handle persistence when previously selected item no longer exists

**Related User Story:** US-12  
**Objective:** Ensure the app behaves correctly when saved selection is no longer in the list.

**Preconditions:**

- Backend ready.
- Ability to modify backend data (or simulate a change) so that:
  - A previously selected `vehRef` or line no longer appears in the returned list.

**Steps:**

1. With current backend data, select a specific `vehRef` in “Vehicle” mode and reload to confirm persistence works.
2. Change the backend (or environment) so this `vehRef` is removed from `/getVehRef`.
3. Reload the SPA in the same browser.
4. Observe the mode and any selection defaults.
5. Repeat for a line in “Line” mode if possible.

**Expected Result:**

- The application does **not** crash.
- The previously saved but now invalid `vehRef`/line is not selected.
- The app shows a sensible default:
  - No selection, or
  - First available valid entry.
- No broken API calls are made using non-existent IDs.

---

## 6. Test Execution & Reporting Guidelines

- **Execution Order:**
  - Run TP-01 and TP-02 first to validate environment.
  - Then TP-03 to TP-17 in sequence or grouped by feature.
- **Logging:**
  - Record for each test:
    - Date
    - Tester
    - Environment (e.g. `dev`, `staging`, `prod`)
    - Browser/version
    - Status: Pass / Fail / Blocked
    - Notes and screenshots for failures.
- **Defects:**
  - Link failing tests to bug tickets.
  - Include:
    - Steps to reproduce
    - Expected vs actual results
    - Environment details
    - Any console/network logs.

---

## 7. Regression Testing

For any code change in:

- API endpoints, or
- Core SPA controls (mode toggle, selectors, map rendering),

the following tests should be run at minimum:

- TP-01, TP-03, TP-05, TP-07, TP-08, TP-10, TP-12, TP-13, TP-14, TP-15, TP-16.

This ensures the main user flows (ready check, list loading, selection, search, map display, persistence) continue to work after modifications.

---
