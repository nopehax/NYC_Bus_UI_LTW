# Software Interface Agreement: NYC Bus Trip API

## 1. Overview

This document defines the interface agreement between the NYC Bus Trip Explorer frontend application and the NYC Bus Engine backend API. The API provides bus trip data for New York City transit routes.

## 2. Service Endpoint

**Base URL:** `https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip`

## 3. API Endpoints

### 3.1 Health Check

**Endpoint:** `GET /ready`

**Purpose:** Verify that the server is operational and ready to handle requests.

**Request Parameters:** None

**Response Format:** JSON

**Response Schema:**
```json
{
  "status": "Ready"
}
```

**Success Criteria:** 
- HTTP Status: 200 OK
- Response body contains `status` field with value `"Ready"`

**Error Handling:**
- Non-200 status codes indicate server unavailability
- Client should implement retry logic with appropriate backoff

---

### 3.2 Get Vehicle References

**Endpoint:** `GET /getVehRef`

**Purpose:** Retrieve a list of all available vehicle reference identifiers currently tracked by the system.

**Request Parameters:** None

**Response Format:** JSON

**Response Schema:**
```json
["MTA_12345", "MTA_67890", "MTA_11111"]
```

**Response Type:** Array of strings, where each string represents a unique vehicle reference identifier.

**Notes:**
- Vehicle references are unique identifiers assigned to individual buses

---

### 3.3 Get Published Line Names

**Endpoint:** `GET /getPubLineName`

**Purpose:** Retrieve a list of all available bus line names (routes) in the NYC transit system.

**Request Parameters:** None

**Response Format:** JSON

**Response Schema:**
```json
["Bx2", "M15", "Q44", "S53"]
```

**Response Type:** Array of strings, where each string represents a published line name.

**Notes:**
- Line names follow MTA's published route naming conventions
- Includes routes from all NYC boroughs (Bronx, Manhattan, Queens, Brooklyn, Staten Island)
- List represents currently active routes

---

### 3.4 Get Bus Trip by Vehicle Reference

**Endpoint:** `GET /getBusTripByVehRef/{vehRef}`

**Purpose:** Retrieve geographic trip data for a specific vehicle identified by its vehicle reference.

**Path Parameters:**
- `vehRef` (string, required): URL-encoded vehicle reference identifier

**Request Example:**
```
GET /getBusTripByVehRef/MTA_12345
```

**Response Format:** GeoJSON FeatureCollection

**Response Schema:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point" | "LineString" | "Polygon",
        "coordinates": [...]
      },
      "properties": { ... }
    }
  ]
}
```

**Response Details:**
- Conforms to GeoJSON specification (RFC 7946)
- `features` array contains geographic representations of the bus trip
- May include points (stops), line strings (route paths), or other geometric types
- Client is responsible for rendering the GeoJSON data on a map

**Error Cases:**
- Invalid or non-existent vehicle reference returns error status
- Vehicle with no current trip data may return empty features array

---

### 3.5 Get Bus Trip by Published Line Name

**Endpoint:** `GET /getBusTripByPubLineName/{pubLineName}`

**Purpose:** Retrieve geographic trip data for a specific bus line/route identified by its published name.

**Path Parameters:**
- `pubLineName` (string, required): URL-encoded published line name

**Request Example:**
```
GET /getBusTripByPubLineName/Bx2
```

**Response Format:** GeoJSON FeatureCollection

**Response Schema:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point" | "LineString" | "Polygon",
        "coordinates": [...]
      },
      "properties": { ... }
    }
  ]
}
```

**Response Details:**
- Conforms to GeoJSON specification (RFC 7946)
- `features` array contains geographic representations of the bus line's route
- May represent the complete route or current active trips on that line
- Client is responsible for rendering the GeoJSON data on a map

**Error Cases:**
- Invalid or non-existent line name returns error status
- Line with no current trip data may return empty features array

---

## 4. Common Specifications

### 4.1 Data Encoding

- All string parameters in URLs must be URL-encoded (percent-encoded)
- Response bodies are UTF-8 encoded JSON

### 4.2 HTTP Methods

- All endpoints use HTTP GET method
- No request body is required for any endpoint

### 4.3 Authentication

- No authentication is currently required
- API is publicly accessible

### 4.4 Rate Limiting

- No explicit rate limiting is documented
- Clients should implement reasonable request throttling to avoid overwhelming the server

---

## 5. Geographic Data Format

### 5.1 GeoJSON Standard

All geographic data returned by trip endpoints follows the GeoJSON specification:
- **Coordinate System:** WGS84 (EPSG:4326)
- **Coordinate Format:** `[longitude, latitude]` or `[longitude, latitude, elevation]`
- **Feature Types:** Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon

### 5.2 Rendering Requirements

Clients are expected to:
- Parse GeoJSON FeatureCollection responses
- Render features on a geographic map (e.g., using Leaflet, Mapbox, Google Maps)
- Handle empty feature collections gracefully
- Implement appropriate map bounds fitting when data is available

---

## 6. Typical Usage Flow

1. **Initialization:**
   - Call `/ready` to verify server availability
   - Call `/getVehRef` and `/getPubLineName` to populate selection lists

2. **User Selection:**
   - User selects either a vehicle reference or line name
   - Client determines which trip endpoint to call based on selection mode

3. **Trip Data Retrieval:**
   - Call `/getBusTripByVehRef/{vehRef}` or `/getBusTripByPubLineName/{pubLineName}`
   - Parse GeoJSON response
   - Render trip data on map

---

## 7. Client Implementation Notes

- The frontend implements request race condition handling using request IDs
- State persistence is managed client-side using localStorage
- Map rendering uses Leaflet with OpenStreetMap tiles
- The API does not support pagination; all results are returned in a single response

---

## 8. Versioning and Changes

- Current API version: 1.0
- Clients should monitor the `/ready` endpoint for service availability

---

## 9. Support and Contact

*Contact information for API support should be specified by the service provider.*

---

## Appendix A: Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ready` | GET | Health check |
| `/getVehRef` | GET | List vehicle references |
| `/getPubLineName` | GET | List line names |
| `/getBusTripByVehRef/{vehRef}` | GET | Get trip by vehicle |
| `/getBusTripByPubLineName/{pubLineName}` | GET | Get trip by line |

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Active