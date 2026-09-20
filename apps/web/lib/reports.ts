// Report aggregate computation lives in the API module; this only re-exports
// the pure date helper the analytics page needs to decide button state.
export { isEventPastInManila } from "../../api/src/modules/report/domain/report";
