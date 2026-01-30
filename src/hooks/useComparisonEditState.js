import { useCallback, useEffect, useMemo, useReducer } from 'react';

const initialState = {
    title: '',
    modality: 'PME',
    region_id: '',
    lives_range: '',
    type: 'COM',
    snapshot: {},
    selections: [],
    activeOperator: '',
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'initialize': {
            return {
                ...state,
                ...action.payload,
                snapshot: action.payload.snapshot || {},
                selections: action.payload.selections || [],
                activeOperator: action.payload.activeOperator || '',
            };
        }
        case 'set_field':
            return { ...state, [action.field]: action.value };
        case 'set_active_operator':
            return { ...state, activeOperator: action.value };
        case 'toggle_selection': {
            const exists = state.selections.find(
                (s) => String(s.operator_id) === String(action.operatorId) && String(s.plan_id) === String(action.planId),
            );
            if (exists) {
                return {
                    ...state,
                    selections: state.selections.filter(
                        (s) =>
                            !(
                                String(s.operator_id) === String(action.operatorId) &&
                                String(s.plan_id) === String(action.planId)
                            ),
                    ),
                };
            }
            return {
                ...state,
                selections: [
                    ...state.selections,
                    {
                        operator_id: action.operatorId,
                        plan_id: action.planId,
                        is_client_plan: false,
                        is_featured: false,
                    },
                ],
            };
        }
        case 'mark_client':
            return {
                ...state,
                selections: state.selections.map((s, idx) => ({
                    ...s,
                    is_client_plan: idx === action.index,
                })),
            };
        case 'mark_featured':
            return {
                ...state,
                selections: state.selections.map((s, idx) => ({
                    ...s,
                    is_featured: idx === action.index,
                })),
            };
        case 'remove_selection':
            return {
                ...state,
                selections: state.selections.filter((_, idx) => idx !== action.index),
            };
        case 'update_snapshot':
            return {
                ...state,
                snapshot: {
                    ...state.snapshot,
                    [action.key]: Number(action.value) || 0,
                },
            };
        case 'reorder': {
            const { from, to } = action;
            if (from === null || to === null || from === to) return state;
            const arr = [...state.selections];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return { ...state, selections: arr };
        }
        default:
            return state;
    }
};

export default function useComparisonEditState(data) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (!data) return;
        dispatch({
            type: 'initialize',
            payload: {
                title: data.comparison?.title || '',
                modality: data.comparison?.modality || 'PME',
                region_id: data.comparison?.region_id || data.regions?.[0]?.id || '',
                lives_range: data.comparison?.lives_range || data.livesRanges?.[0] || '',
                type: data.comparison?.type || 'COM',
                snapshot: data.existingSnapshot || {},
                selections: (data.existingSelections || []).map((s) => ({
                    operator_id: s.operator_id,
                    plan_id: s.plan_id,
                    is_client_plan: !!s.is_client_plan,
                    is_featured: !!s.is_featured,
                    total_with_coparticipation: s.total_with_coparticipation ?? null,
                    total_coparticipacao_parcial: s.total_coparticipacao_parcial ?? null,
                    total_without_coparticipation: s.total_without_coparticipation ?? null,
                })),
                activeOperator: data.operators?.[0]?.id || '',
            },
        });
    }, [data]);

    const updateField = useCallback((field, value) => {
        dispatch({ type: 'set_field', field, value });
    }, []);

    const setActiveOperator = useCallback((operatorId) => {
        dispatch({ type: 'set_active_operator', value: operatorId });
    }, []);

    const toggleSelection = useCallback((operatorId, planId) => {
        dispatch({ type: 'toggle_selection', operatorId, planId });
    }, []);

    const markClient = useCallback((index) => {
        dispatch({ type: 'mark_client', index });
    }, []);

    const markFeatured = useCallback((index) => {
        dispatch({ type: 'mark_featured', index });
    }, []);

    const removeSelection = useCallback((index) => {
        dispatch({ type: 'remove_selection', index });
    }, []);

    const updateSnapshot = useCallback((key, value) => {
        dispatch({ type: 'update_snapshot', key, value });
    }, []);

    const handleReorder = useCallback((from, to) => {
        dispatch({ type: 'reorder', from, to });
    }, []);

    const sortableIds = useMemo(
        () => state.selections.map((sel, idx) => `${sel.operator_id}-${sel.plan_id}-${idx}`),
        [state.selections],
    );

    const totalVidas = useMemo(
        () => Object.values(state.snapshot || {}).reduce((acc, val) => acc + Number(val || 0), 0),
        [state.snapshot],
    );

    return {
        state,
        sortableIds,
        totalVidas,
        toggleSelection,
        markClient,
        markFeatured,
        removeSelection,
        updateSnapshot,
        setActiveOperator,
        updateField,
        handleReorder,
    };
}
