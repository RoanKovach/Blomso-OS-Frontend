import { useCallback, useState } from "react";

const PREFIX = "blomso.myrecords.collapsible.";

function readStored(fullKey, defaultOpen) {
    try {
        const v = localStorage.getItem(fullKey);
        if (v === null) return defaultOpen;
        return v === "true";
    } catch {
        return defaultOpen;
    }
}

/**
 * Persist open/closed state for My Records section collapsibles.
 * @param {string} key - short key (e.g. "filters"); prefixed in storage
 * @param {boolean} [defaultOpen=true]
 */
export function usePersistedCollapsible(key, defaultOpen = true) {
    const fullKey = `${PREFIX}${key}`;
    const [open, setOpen] = useState(() => readStored(fullKey, defaultOpen));

    const setOpenPersist = useCallback(
        (next) => {
            setOpen(next);
            try {
                localStorage.setItem(fullKey, String(next));
            } catch {
                /* ignore quota / private mode */
            }
        },
        [fullKey]
    );

    return [open, setOpenPersist];
}
