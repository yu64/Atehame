import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";

/** 拡大率と吸着。 */
export function useDesignerView() {
  const store = useDesignerStore();
  const zoom = useDesignerSelector(state => state.zoom);
  const gridSnap = useDesignerSelector(state => state.gridSnap);
  const fitRequest = useDesignerSelector(state => state.fitRequest);
  return {
    zoom,
    gridSnap,
    fitRequest,
    setZoom: store.setZoom,
    setGridSnap: store.setGridSnap,
    requestFit: store.requestFit,
  };
}

export default useDesignerView;
