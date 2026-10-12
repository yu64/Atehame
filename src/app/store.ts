import { atomWithStorage } from "jotai/utils";

// #############################################################################
// MARK: 状態

export const isDarkAtom = atomWithStorage<boolean>("is_dark", false);
