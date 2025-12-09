# NYC Bus Trip Viewer – User Stories

## 1. Functionalities (Overview)

**F1. Backend connectivity & readiness**

- Check whether the backend service is ready to serve data.
- Show a clear message when the server is unavailable or not ready.

**F2. Vehicle-based trip exploration**

- Fetch and display a list of available vehicle references.
- Allow the user to select a vehicle and view its trip on the map.

**F3. Line-based trip exploration**

- Fetch and display a list of available public line names.
- Allow the user to select a line and view its trip(s) on the map.

**F4. Map visualisation**

- Render returned trip data as GeoJSON on an interactive map.
- Automatically fit/zoom the map to the visible trip(s).

**F5. Error handling & feedback**

- Provide clear error messages when API calls fail.
- Avoid leaving the user in an inconsistent or unclear state when errors occur.

---

## 2. User Stories & Acceptance Criteria

**Personas:** 
  1. `user`

### US-1 – Check server readiness on startup

**As a** user  
**I want** the application to verify the backend server is ready  
**So that** I know whether I can start exploring NYC bus trips

**Acceptance Criteria**

- Given I open the application  
  - When the app loads  
  - Then it must call the server’s readiness endpoint (`/ready`).
- Given the server returns `{"status": "Ready"}`  
  - When the readiness check completes  
  - Then the application must proceed to load vehicle and line lists without showing an error.
- Given the server returns a non-"Ready" status or a non-2xx HTTP code  
  - When the readiness check completes  
  - Then the application must:
    - Stop further data loading (no list or trip requests), and  
    - Display a visible message indicating the server is not ready or unavailable.
    - Display a retry button to reload the page.

---

### US-2 – View available vehicle references

**As a** user  
**I want** to see a list of available vehicle references  
**So that** I can choose a specific bus to inspect its trip

**Acceptance Criteria**

- Given the backend is ready  
  - When the app loads  
  - Then it must request the vehicle reference list (`/getVehRef`) once.
- Given the server returns a JSON array of strings  
  - When the list is loaded successfully  
  - Then the application must populate a “Vehicle” selection control with those values.
- Given the list is non-empty  
  - When the user first access the webpage,
  - the first entry is selected, by default.
- Given the vehicle list request fails  
  - When the request completes with error  
  - Then the application must:
    - Show an error message, and  
    - Leave the vehicle selection control disabled.

---

### US-3 – View available public line names

**As a** user  
**I want** to see a list of available public line names  
**So that** I can explore routes by bus line

**Acceptance Criteria**

- Given the backend is ready  
  - When the app loads  
  - Then it must request the public line name list (`/getPubLineName`) once.
- Given the server returns a JSON array of strings  
  - When the list is loaded successfully  
  - Then the application must populate a “Line” selection control with those values.
- Given the line list is non-empty  
  - When the user first access the webpage,
  - the first entry is selected, by default.
- Given the line list request fails  
  - When the request completes with error  
  - Then the application must:
    - Show an error message, and  
    - Leave the line selection control disabled.

---

### US-4 – Search for a specific vehicle or line

**As a** user  
**I want** to search within the list of vehicle references or line names  
**So that** I can quickly find the exact bus or route I’m interested in

**Acceptance Criteria**

- Given I am on the main screen and the vehicle list has loaded  
  - When I focus the “Vehicle” selector or its associated search input  
  - And I start typing a partial or full vehicle reference (e.g. `1234`)  
  - Then the list of options must be filtered to only show vehicle references that contain the typed text (case-insensitive).

- Given I am on the main screen and the line list has loaded  
  - When I focus the “Line” selector or its associated search input  
  - And I start typing a partial or full line name (e.g. `M15`)  
  - Then the list of options must be filtered to only show line names that contain the typed text (case-insensitive).

- Given there are matching results for my search text  
  - When the list is filtered  
  - Then:
    - I must be able to select one of the filtered results, and  
    - Upon selection, the corresponding trip data must be requested and displayed as defined in US-6 and US-7.

- Given there are **no** matching results for my search text  
  - When the list is filtered  
  - Then the UI must:
    - Show an empty result state (i.e. text with `"No option"`), and  
    - Prevent me from making an invalid selection.

- Given I clear the search text  
  - When the search field becomes empty  
  - Then the full list of vehicles/lines must be visible again.

- The search/filtering behaviour must:
  - Work consistently for both “Vehicle” and “Line” modes, and  
  - Not cause additional unnecessary API calls (filtering is done on the already-loaded lists).

---

### US-5 – Switch between vehicle and line modes

**As a** user  
**I want** to switch between selecting a specific vehicle and selecting a bus line  
**So that** I can explore trips in different ways

**Acceptance Criteria**

- Given I am on the main screen  
  - When I toggle the mode (e.g. between “Vehicle” and “Line”)  
  - Then the application must clearly indicate which mode is active.
- Given I switch to “Vehicle” mode  
  - When the mode becomes active  
  - Then:
    - The vehicle selection control must be enabled and visible, and  
    - The line selection control must be visually de-emphasised.
- Given I switch to “Line” mode  
  - When the mode becomes active  
  - Then:
    - The line selection control must be enabled and visible, and  
    - The vehicle selection control must be visually de-emphasised.
- Switching modes must **not** cause the application to crash.

---

### US-6 – View trip for a selected vehicle

**As a** user  
**I want** to select a vehicle reference and see its trip on the map  
**So that** I can visually inspect the bus path for that specific vehicle

**Acceptance Criteria**

- Given the vehicle list has been loaded and “Vehicle” mode is active  
  - When I select a specific vehicle from the list  
  - Then the application must request `/getBusTripByVehRef/{vehRef}` using that value, and
  - Clear any previously displayed trip related to another selection.
- Given the server returns a valid GeoJSON FeatureCollection  
  - When the response is received  
  - Then the application must:
    - Render the new trip geometry on the map, and  
    - Automatically adjust the map view to fit the full extent of the trip.
- Given the trip request for a vehicle fails (network or server error)  
  - When the request completes with error  
  - Then the application must:
    - Display an error message, and  
    - Avoid updating the map with partial or stale data from that failed request.

---

### US-7 – View trip for a selected line

**As a** user  
**I want** to select a public line name and see the trip(s) on the map  
**So that** I can understand the route covered by that bus line

**Acceptance Criteria**

- Given the line list has been loaded and “Line” mode is active  
  - When I select a line from the list  
  - Then the application must request `/getBusTripByPubLineName/{pubLineName}` using that value, and
  - Clear any previously displayed trip related to another selection.  
- Given the server returns a valid GeoJSON FeatureCollection  
  - When the response is received  
  - Then the application must:
    - Render all returned features for that line on the map, and  
    - Automatically adjust the map view to fit the full extent of the returned geometry.
- Given the response contains multiple features (e.g. branches or directions)  
  - When rendered on the map  
  - Then all features must be visible within the fitted bounds (user should not need to manually search for them).
- Given the trip request for a line fails  
  - When the request completes with error  
  - Then the application must:
    - Display an error message, and  
    - Avoid displaying partial or inconsistent route data.

---

### US-8 – Highlight route elements on hover

**As a** user
**I want** points and lines on the map to change colour when I hover over them
**So that** I can more clearly see which element I am focusing on

**Acceptance Criteria**

- Given a point or line is visible on the map/graph
  - When the user hovers the mouse over that point or line
  - Then:
    - That specific element must change to a highlight colour (i.e. bright green #00FF00).
- Given a different point or line is currently highlighted
  - When the user moves the mouse hover to another point or line
  - Then:
    - The previously highlighted element must revert to its default colour
    - And the newly hovered element must change to the highlight colour.
- Given a point or line is highlighted because of hover
  - When the user moves the mouse away so it is no longer over any interactive element
  - Then:
    - All elements must revert to their default colours.

---

### US-9 – View details for a route element

**As a** user  
**I want** to see additional details when I click on a point or line  
**So that** I can better understand the information represented by that element  

**Acceptance Criteria**

- Given a point or line is visible on the map/graph  
  - When the user clicks on that point or line  
  - Then:
    - The application must display a details panel for that specific element that contains additional information of that element.
- Given the details panel is displayed for one element  
  - When the user clicks on a different point or line,
  - Then:
    - The previously shown details must be replaced  
    - And the panel must show the details for the newly clicked element.
- Given the details panel is displayed  
  - When the user clicks outside any point or line (e.g. on an empty area of the map/graph or a close button)  
  - Then:
    - The details panel/tooltip must be hidden.

---

### US-10 – Handle concurrent/frequent selections safely

**As a** user  
**I want** the map to always show the route for my most recent selection  
**So that** I don’t see outdated or mismatched data if I change my mind quickly

**Acceptance Criteria**

- Given I rapidly change selections (vehicles and/or lines)  
  - When multiple API requests are in-flight  
  - Then:
    - Only the data from the most recent selection must be rendered on the map, and  
    - Any slower, earlier responses must be ignored when they arrive.
- The application must not show conflicting messages or overlapping routes from different selections if they originate from different requests.

---

### US-11 – Preserve my current selection across reloads

**As a** user  
**I want** my current vehicle/line selection and mode to be remembered  
**So that** when I reload the page or come back later in the same browser, I don’t have to reselect it

**Acceptance Criteria**

- Given I have selected a specific vehicle in “Vehicle” mode  
  - And the vehicle list has loaded successfully  
  - When I reload the page in the same browser  
  - Then:
    - The application must start in “Vehicle” mode, and  
    - The previously selected vehicle must be pre-selected, and  
    - The corresponding trip data must be automatically requested and displayed.

- Given I have selected a specific line in “Line” mode  
  - And the line list has loaded successfully  
  - When I reload the page in the same browser  
  - Then:
    - The application must start in “Line” mode, and  
    - The previously selected line must be pre-selected, and  
    - The corresponding trip data must be automatically requested and displayed.

- Given I change my selection (vehicle or line)  
  - When the change is confirmed (e.g. selection dropdown closes)  
  - Then the new selection and mode must replace the previous saved values for future reloads.

- The persistence behaviour must:
  - Only apply within the same browser profile (i.e. not shared across devices), and  
  - Not require the user to perform any explicit “Save” action.

---

## 3. Notes

- These user stories describe the behaviour of the **existing SPA** that visualises NYC bus routes using the backend API defined in the Software Interface Agreement.
