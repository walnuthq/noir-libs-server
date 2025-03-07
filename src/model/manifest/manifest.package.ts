export class ManifestPackage {
    name?: string;
    type?: 'lib' | 'contract';
    compilerVersion?: string;
    authors?: string[];
    version?: string;
    description?: string;
    license?: string;
    keywords?: string[];
    documentation?: string;
    repository?: string;
}