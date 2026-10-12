import { atomWithStorage } from "jotai/utils";

export const isDarkAtom = atomWithStorage<boolean>("is_dark", false);
