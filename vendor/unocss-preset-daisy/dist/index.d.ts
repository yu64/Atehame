import { Preset } from 'unocss';

interface Options {
    base?: boolean;
    darkTheme?: boolean;
    logs?: boolean;
    prefix?: string;
    styled?: boolean;
    themeRoot?: string;
    themes?: string[];
    utils?: boolean;
    variablePrefix?: string;
}
declare function presetDaisy(options?: Options): Promise<Preset<Record<string, any>>>;

export { presetDaisy };
