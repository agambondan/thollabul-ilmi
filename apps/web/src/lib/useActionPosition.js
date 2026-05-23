'use client';

import { useEffect, useState } from 'react';

const ACTION_POSITION_KEY = 'actionPosition';
const DEFAULT_POSITION = 'side';
const VALID_POSITIONS = ['side', 'menu'];

export const useActionPosition = () => {
    const [position, setPositionState] = useState(DEFAULT_POSITION);

    useEffect(() => {
        const stored = localStorage.getItem(ACTION_POSITION_KEY);
        if (VALID_POSITIONS.includes(stored)) {
            setPositionState(stored);
        }
        const handler = (e) => {
            if (e.key === ACTION_POSITION_KEY && VALID_POSITIONS.includes(e.newValue)) {
                setPositionState(e.newValue);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const setPosition = (nextPosition) => {
        const value = VALID_POSITIONS.includes(nextPosition) ? nextPosition : DEFAULT_POSITION;
        localStorage.setItem(ACTION_POSITION_KEY, value);
        window.dispatchEvent(new StorageEvent('storage', { key: ACTION_POSITION_KEY, newValue: value }));
        setPositionState(value);
    };

    return { isMenu: position === 'menu', position, setPosition };
};
