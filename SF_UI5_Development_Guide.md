# SuccessFactors & SAPUI5 Development Guide

This document summarizes the core development patterns and best practices for building SAP Fiori applications integrated with SuccessFactors HCM OData API.

## 1. SuccessFactors OData API Optimization

### Navigation Properties & $expand
To minimize network round-trips, use the `$expand` query option. This allows fetching related entities in a single request.
- **Example**: Fetching a User along with their current Job Information and Manager details.
  `path: "/User('sfadmin')?$expand=empJobNav/managerUserNav"`

### Data Filtering & Sorting
- **Filtering**: Use `$filter` to retrieve specific records (e.g., `userId eq 'sfadmin'`).
- **Sorting**: Use `$orderby` for server-side sorting. However, for complex date logic or when combining multiple data sources, client-side sorting in the controller provides more reliability.
  ```javascript
  aHistory.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  ```

## 2. SAPUI5 Architecture Patterns

### Model Management
- **ODataModel**: Used for server-side data binding.
- **JSONModel (View Model)**: Used for local UI state management (e.g., `busy` indicators, temporary URLs, or processed arrays like `jobHistory`).

### Modular UI with Fragments
Use Fragments (`.fragment.xml`) for reusable UI components like Dialogs. This keeps the main View clean and improves maintainability.
- **Loading**: `Fragment.load({ ... })`
- **Binding**: Use `oDialog.setBindingContext(oContext, "modelName")` to pass data to the fragment.

## 3. User Experience (UX) Best Practices

### Skeleton Loading (Placeholder UI)
Instead of a simple busy spinner, use "Skeleton" or "Placeholder" loading to give users a visual cue of the content structure.
- **Implementation**: Use a CSS shimmer animation applied to `VBox` or `HBox` elements that match the shape of the final content.
- **Control**: Toggle visibility using a `busy` property in the View Model.

### Responsive Design
- **ToolPage**: Use `sap.tnt.ToolPage` for a standard Fiori shell with side navigation.
- **Device API**: Use `sap.ui.Device` to detect mobile environments and adjust UI behavior (e.g., collapsing the side menu or using pop-ins in tables).

## 4. Key Entities for People Profile
| Entity | Description | Key Navigation Properties |
| :--- | :--- | :--- |
| `User` | Basic profile data | `empJobNav`, `photoNav` |
| `EmpJob` | Job Information / History | `eventNav`, `eventReasonNav`, `managerUserNav` |
| `Photo` | Profile pictures | N/A |

## 5. Common Implementation Snippet: Multi-Read Promise
When multiple independent OData calls are required before rendering, use `Promise.all`:
```javascript
Promise.all([
    fnRead(sPath),
    fnRead(sPhotoPath)
]).then(([oUserData, oPhotoData]) => {
    // Process all data at once
}).finally(() => {
    oViewModel.setProperty("/busy", false);
});
```