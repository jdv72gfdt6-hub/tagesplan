import { useEffect } from 'react';
import { useStore } from '../lib/store';

export function Toast() {
  const { state, actions } = useStore();
  const id = state.toast?.id;
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(actions.clearToast, 2400);
    return () => clearTimeout(t);
  }, [id, actions]);
  if (!state.toast) return null;
  return (
    <div className="toast glass" role="status" key={state.toast.id}>
      {state.toast.text}
    </div>
  );
}
