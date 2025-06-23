import React, { useState, useEffect } from 'react';

const StarRating = ({ initialRating = 0, onRatingChange, readOnly = false }) => {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(null);

    // Keep in sync if initialRating changes (for readOnly mode)
    useEffect(() => {
        setRating(initialRating);
    }, [initialRating]);

    const getStarFillState = (starNumber) => {
        const currentRating = hoverRating ?? rating;
        if (currentRating >= starNumber) return 'full';
        if (currentRating + 0.5 === starNumber) return 'half';
        return 'empty';
    };

    const handleStarClick = (event, starNumber) => {
        if (readOnly) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const isHalfStar = mouseX < rect.width / 2;
        const newRating = isHalfStar ? starNumber - 0.5 : starNumber;
        const finalRating = newRating === rating ? 0 : newRating;
        setRating(finalRating);
        onRatingChange?.(finalRating);
    };

    const handleStarMouseMove = (event, starNumber) => {
        if (readOnly) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const isHalfStar = mouseX < rect.width / 2;
        setHoverRating(isHalfStar ? starNumber - 0.5 : starNumber);
    };

    const getStarFill = (fillState) => {
        switch (fillState) {
            case 'full': return '#1DB954';
            case 'half': return 'url(#halfStarGradient)';
            default: return 'none';
        }
    };

    return (
        <div className="flex gap-1">
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="halfStarGradient">
                        <stop offset="50%" stopColor="#1DB954" />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>
            {[1, 2, 3, 4, 5].map((starNumber) => {
                const fillState = getStarFillState(starNumber);
                return (
                    <button
                        key={starNumber}
                        className={`w-8 h-8 relative ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={e => handleStarClick(e, starNumber)}
                        onMouseMove={e => handleStarMouseMove(e, starNumber)}
                        onMouseLeave={() => !readOnly && setHoverRating(null)}
                        tabIndex={readOnly ? -1 : 0}
                        type="button"
                        disabled={readOnly}
                        aria-label={readOnly ? undefined : `Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill={getStarFill(fillState)}
                            stroke="#1DB954"
                            className="w-full h-full transition-colors duration-200"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;