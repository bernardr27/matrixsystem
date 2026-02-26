'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardBoot({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; // or a loading spinner
    }

    return <>{children}</>;
}
