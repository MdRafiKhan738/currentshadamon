export function normalizeLabel(label: unknown): string {
    return (typeof label === 'string' ? label : String(label ?? '')).trim();
}

export function isHighlightLabel(label: string): boolean {
    const l = normalizeLabel(label).toLowerCase();
    return l === 'highlight' || l === 'highlights';
}

export function getAdLabels(ad: any): string[] {
    const raw = Array.isArray(ad?.labels) ? ad.labels : [];
    const cleaned = raw.map(normalizeLabel).filter(Boolean);
    return Array.from(new Set(cleaned));
}

export function hasHighlightLabel(ad: any): boolean {
    return getAdLabels(ad).some(isHighlightLabel);
}

export function getNonHighlightLabels(ad: any): string[] {
    return getAdLabels(ad).filter(l => !isHighlightLabel(l));
}

