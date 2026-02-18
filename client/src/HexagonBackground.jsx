import { useState, useEffect, useCallback } from 'react';
import './HexagonBackground.css';

function HexagonBackground({
    hexagonSize = 75,
    hexagonMargin = 3,
    children
}) {
    const hexagonWidth = hexagonSize;
    const hexagonHeight = hexagonSize * 1.1;
    const rowSpacing = hexagonSize * 0.8;
    const baseMarginTop = -36 - 0.275 * (hexagonSize - 100);
    const computedMarginTop = baseMarginTop + hexagonMargin;
    const oddRowMarginLeft = -(hexagonSize / 2);
    const evenRowMarginLeft = hexagonMargin / 2;

    const [gridDimensions, setGridDimensions] = useState({ rows: 0, columns: 0 });

    const updateGridDimensions = useCallback(() => {
        const rows = Math.ceil(window.innerHeight / rowSpacing);
        const columns = Math.ceil(window.innerWidth / hexagonWidth) + 1;
        setGridDimensions({ rows, columns });
    }, [rowSpacing, hexagonWidth]);

    useEffect(() => {
        updateGridDimensions();
        window.addEventListener('resize', updateGridDimensions);
        return () => window.removeEventListener('resize', updateGridDimensions);
    }, [updateGridDimensions]);

    return (
        <div className="hexagon-background">
            <style>{`:root { --hexagon-margin: ${hexagonMargin}px; }`}</style>
            <div className="hex-grid">
                {Array.from({ length: gridDimensions.rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="hex-row"
                        style={{
                            marginTop: computedMarginTop,
                            marginLeft:
                                ((rowIndex + 1) % 2 === 0
                                    ? evenRowMarginLeft
                                    : oddRowMarginLeft) - 10,
                        }}
                    >
                        {Array.from({ length: gridDimensions.columns }).map((_, colIndex) => (
                            <div
                                key={`hex-${rowIndex}-${colIndex}`}
                                className="hexagon"
                                style={{
                                    width: hexagonWidth,
                                    height: hexagonHeight,
                                    marginLeft: hexagonMargin,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {children}
        </div>
    );
}

export default HexagonBackground;
