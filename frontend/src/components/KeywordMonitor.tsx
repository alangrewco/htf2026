import React, { useState, useCallback, useRef } from 'react';

/**
 * KeywordMonitor — User-defined keyword tracking for supply chain signals
 * ========================================================================
 * Ported from WorldMonitor's MonitorPanel.ts.
 *
 * Allows users to add keywords (e.g., "Taiwan", "semiconductor", "LA port")
 * to filter the LiveSignalsPanel feed. Keywords are matched using
 * word-boundary regex for precision (avoids false positives like "ai" in "train").
 */

const MONITOR_COLORS = [
    '#e8c872', '#4ade80', '#818cf8', '#f472b6', '#fb923c',
    '#22d3ee', '#a78bfa', '#facc15', '#f87171', '#34d399',
];

interface KeywordMonitorProps {
    keywords: string[];
    onKeywordsChange: (keywords: string[]) => void;
}

export default function KeywordMonitor({ keywords, onKeywordsChange }: KeywordMonitorProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addKeyword = useCallback(() => {
        const trimmed = inputValue.trim().toLowerCase();
        if (!trimmed) return;

        // Split by comma for batch add
        const newKeywords = trimmed
            .split(',')
            .map((k) => k.trim())
            .filter((k) => k && !keywords.includes(k));

        if (newKeywords.length > 0) {
            onKeywordsChange([...keywords, ...newKeywords]);
        }
        setInputValue('');
        inputRef.current?.focus();
    }, [inputValue, keywords, onKeywordsChange]);

    const removeKeyword = useCallback(
        (keyword: string) => {
            onKeywordsChange(keywords.filter((k) => k !== keyword));
        },
        [keywords, onKeywordsChange],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
            }
        },
        [addKeyword],
    );

    return (
        <div style={styles.container}>
            <div style={styles.label}>Risk Radar</div>
            <div style={styles.inputRow}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add keywords (e.g., Taiwan, strike)"
                    style={styles.input}
                />
                <button onClick={addKeyword} style={styles.addBtn}>
                    +
                </button>
            </div>

            {keywords.length > 0 && (
                <div style={styles.tagsContainer}>
                    {keywords.map((kw, i) => (
                        <span
                            key={kw}
                            style={{
                                ...styles.tag,
                                borderColor: MONITOR_COLORS[i % MONITOR_COLORS.length],
                            }}
                        >
                            <span
                                style={{
                                    ...styles.tagDot,
                                    background: MONITOR_COLORS[i % MONITOR_COLORS.length],
                                }}
                            />
                            {kw}
                            <button
                                onClick={() => removeKeyword(kw)}
                                style={styles.tagRemove}
                                title={`Remove "${kw}"`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {keywords.length === 0 && (
                <div style={styles.hint}>
                    Add keywords to filter the live signals feed for specific risks.
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '12px 16px',
        borderBottom: '1px solid rgba(232, 200, 114, 0.08)',
    },
    label: {
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: '#e8c872',
        marginBottom: '8px',
    },
    inputRow: {
        display: 'flex',
        gap: '6px',
    },
    input: {
        flex: 1,
        padding: '8px 12px',
        fontSize: '12px',
        border: '1px solid rgba(232, 200, 114, 0.12)',
        borderRadius: '6px',
        background: 'rgba(255, 255, 255, 0.03)',
        color: '#e4e0d8',
        outline: 'none',
        fontFamily: 'inherit',
    },
    addBtn: {
        padding: '8px 14px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        borderRadius: '6px',
        background: 'rgba(232, 200, 114, 0.15)',
        color: '#e8c872',
        cursor: 'pointer',
        transition: 'background 0.15s',
    },
    tagsContainer: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '6px',
        marginTop: '10px',
    },
    tag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        borderRadius: '12px',
        border: '1px solid',
        color: '#c8c4bc',
        background: 'rgba(255, 255, 255, 0.02)',
    },
    tagDot: {
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        flexShrink: 0,
    },
    tagRemove: {
        background: 'none',
        border: 'none',
        color: '#6b6b78',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: 1,
        padding: '0 2px',
        marginLeft: '2px',
    },
    hint: {
        fontSize: '11px',
        color: '#4a4a56',
        marginTop: '8px',
        lineHeight: '1.4',
    },
};
