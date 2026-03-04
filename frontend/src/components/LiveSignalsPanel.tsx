import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * LiveSignalsPanel — Live maritime/logistics news feed
 * =====================================================
 * Ported from WorldMonitor's LiveNewsPanel concept.
 * Fetches live signals from the backend /api/signals endpoint
 * and displays them in a scrollable feed with auto-refresh.
 *
 * Design: Uses HarborGuard's dark theme (warm charcoal #0c0c12,
 * cream text #e4e0d8, amber accent #e8c872).
 */

interface Signal {
    id: string;
    title: string;
    description: string;
    link: string;
    source: string;
    published_at: string | null;
    matched_keywords?: string[];
}

interface SignalsResponse {
    signals: Signal[];
    total: number;
    feeds_count: number;
}

interface LiveSignalsPanelProps {
    apiBase?: string;
    keywords?: string[];
    refreshIntervalMs?: number;
    maxItems?: number;
}

function timeAgo(isoString: string | null): string {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function LiveSignalsPanel({
    apiBase = '/api/signals',
    keywords = [],
    refreshIntervalMs = 60000,
    maxItems = 30,
}: LiveSignalsPanelProps) {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchSignals = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (keywords.length > 0) {
                params.set('keywords', keywords.join(','));
            }
            params.set('limit', String(maxItems));

            const url = `${apiBase}?${params.toString()}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const data: SignalsResponse = await resp.json();
            setSignals(data.signals);
            setLastRefresh(new Date());
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch signals');
        } finally {
            setLoading(false);
        }
    }, [apiBase, keywords, maxItems]);

    useEffect(() => {
        fetchSignals();
        intervalRef.current = setInterval(fetchSignals, refreshIntervalMs);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSignals, refreshIntervalMs]);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.liveDot} />
                    <span style={styles.headerTitle}>Live Signals</span>
                </div>
                <div style={styles.headerRight}>
                    {lastRefresh && (
                        <span style={styles.lastRefresh}>
                            Updated {timeAgo(lastRefresh.toISOString())}
                        </span>
                    )}
                    <button onClick={fetchSignals} style={styles.refreshBtn} title="Refresh">
                        ↻
                    </button>
                </div>
            </div>

            {/* Signal items */}
            <div style={styles.feed}>
                {loading && signals.length === 0 && (
                    <div style={styles.emptyState}>Loading signals...</div>
                )}
                {error && (
                    <div style={styles.errorState}>⚠ {error}</div>
                )}
                {!loading && signals.length === 0 && !error && (
                    <div style={styles.emptyState}>
                        No signals found{keywords.length > 0 ? ` for "${keywords.join(', ')}"` : ''}
                    </div>
                )}
                {signals.map((signal) => (
                    <a
                        key={signal.id}
                        href={signal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            ...styles.signalItem,
                            borderLeftColor: signal.matched_keywords?.length
                                ? '#e8c872'
                                : 'transparent',
                        }}
                    >
                        <div style={styles.signalMeta}>
                            <span style={styles.signalSource}>{signal.source}</span>
                            <span style={styles.signalTime}>
                                {timeAgo(signal.published_at)}
                            </span>
                        </div>
                        <div style={styles.signalTitle}>{signal.title}</div>
                        {signal.matched_keywords && signal.matched_keywords.length > 0 && (
                            <div style={styles.matchedKeywords}>
                                {signal.matched_keywords.map((kw) => (
                                    <span key={kw} style={styles.keywordTag}>{kw}</span>
                                ))}
                            </div>
                        )}
                    </a>
                ))}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0e0e16',
        borderLeft: '1px solid rgba(232, 200, 114, 0.06)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(232, 200, 114, 0.08)',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    liveDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#4ade80',
        boxShadow: '0 0 6px rgba(74, 222, 128, 0.5)',
        animation: 'pulse 2s ease-in-out infinite',
    },
    headerTitle: {
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: '#8a8a96',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    lastRefresh: {
        fontSize: '10px',
        color: '#4a4a56',
    },
    refreshBtn: {
        background: 'none',
        border: 'none',
        color: '#6b6b78',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        transition: 'color 0.2s',
    },
    feed: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '8px 0',
    },
    signalItem: {
        display: 'block',
        padding: '10px 16px',
        borderLeft: '2px solid transparent',
        textDecoration: 'none',
        transition: 'background 0.15s ease',
        cursor: 'pointer',
    },
    signalMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    signalSource: {
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: '#e8c872',
    },
    signalTime: {
        fontSize: '10px',
        color: '#4a4a56',
    },
    signalTitle: {
        fontSize: '13px',
        lineHeight: '1.4',
        color: '#c8c4bc',
    },
    matchedKeywords: {
        display: 'flex',
        gap: '4px',
        marginTop: '6px',
        flexWrap: 'wrap' as const,
    },
    keywordTag: {
        fontSize: '9px',
        padding: '2px 6px',
        borderRadius: '3px',
        background: 'rgba(232, 200, 114, 0.12)',
        color: '#e8c872',
        letterSpacing: '0.05em',
    },
    emptyState: {
        padding: '40px 16px',
        textAlign: 'center' as const,
        color: '#4a4a56',
        fontSize: '12px',
    },
    errorState: {
        padding: '16px',
        color: '#ef4444',
        fontSize: '12px',
    },
};
