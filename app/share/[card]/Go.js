'use client';
import { useEffect } from 'react';
/** Send people who open a share link on to the site (link-preview bots don't run this). */
export default function Go({ to }) { useEffect(() => { location.replace(to); }, [to]); return null; }
