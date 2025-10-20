import clsx from "clsx";
import { twMerge } from "tw-merge";

export const cn = (...classes: string[]) => {
    return twMerge(clsx(classes));
}