import React from 'react';

const MM_ICONS = {"back":{"p":["M15 19l-7-7 7-7"]},"forward":{"p":["M9 5l7 7-7 7"]},"close":{"p":["M18 6L6 18M6 6l12 12"]},"bell":{"p":["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.7 21a2 2 0 01-3.4 0"]},"search":{"p":["M20 20l-3.5-3.5"],"c":[[11,11,7]],"w":2.4},"lock":{"p":["M8 11V8a4 4 0 018 0v3"],"r":[[5,11,14,10,2]],"w":2.4},"share":{"p":["M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8","M16 6l-4-4-4 4","M12 2v14"]},"chat":{"p":["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]},"home":{"p":["M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"]},"book":{"p":["M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-4-8 4z"]},"users":{"p":["M2 20a7 7 0 0114 0"],"c":[[9,8,3.4]]},"user":{"p":["M4 21a8 8 0 0116 0"],"c":[[12,8,3.6]]},"star":{"p":["M12 2l3 6 6 .8-4.5 4.3 1.2 6.4L12 16.5 6.3 19.5l1.2-6.4L3 8.8 9 8z"]},"check":{"p":["M4 12.5l5.5 5.5L20 7"],"w":3.4},"alert":{"p":["M12 8v5","M10.3 3.5L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.5a2 2 0 00-3.4 0z"],"c":[[12,17,0.7]],"w":2.6},"card":{"p":["M2 10h20"],"r":[[2,5,20,14,2]]},"eye":{"p":["M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"],"c":[[12,12,2.6]]},"download":{"p":["M12 3v12M7 11l5 5 5-5M4 20h16"]},"trash":{"p":["M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"]},"doc":{"p":["M4 5h16v14H4z","M4 9h16"]},"send":{"p":["M5 12h14M13 6l6 6-6 6"],"w":2.6},"bookmark":{"p":["M6 3h12v18l-6-4.5L6 21z"]},"comment":{"p":["M4 4h16v13H8l-4 4z"]},"dots":{"c":[[12,12,2.2],[12,5,1.4],[12,19,1.4]]},"play":{"fill":"M7 4 L20 12 L7 20 Z","solid":true},"bars":{"p":["M4 18v-6M10 18V6M16 18v-9M22 18V3"]},"globe":{"p":["M12 2a9 9 0 100 18 9 9 0 000-18zM3 12h18","M12 2a14 14 0 010 18 14 14 0 010-18z"]},"chevron":{"p":["M6 9l6 6 6-6"]},"list":{"p":["M4 6h16M4 12h16M4 18h10"]},"calendar":{"p":["M3 10h18M8 3v4M16 3v4"],"r":[[3,5,18,16,2]]},"case":{"p":["M4 7h16v13H4zM9 7V4h6v3"]},"info":{"p":["M12 11v6M12 7.5v.5"],"c":[[12,12,9]]},"plus":{"p":["M12 3v18M3 12h18"]},"heart":{"p":["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"],"w":2},"repeat":{"p":["m2 9 3-3 3 3","M13 18H7a2 2 0 0 1-2-2V6","m22 15-3 3-3-3","M11 6h6a2 2 0 0 1 2 2v10"],"w":2}};

export function Icon({name='check',size=19,strokeWidth,color='currentColor',style}){
  const ic = MM_ICONS[name] || MM_ICONS.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ic.solid?'none':color}
      strokeWidth={strokeWidth||ic.w||2.2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {ic.solid && <path d={ic.fill} fill={color} />}
      {(ic.r||[]).map((r,i)=><rect key={'r'+i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />)}
      {(ic.c||[]).map((c,i)=><circle key={'c'+i} cx={c[0]} cy={c[1]} r={c[2]} />)}
      {(ic.p||[]).map((d,i)=><path key={'p'+i} d={d} />)}
    </svg>
  );
}

export const iconNames = Object.keys(MM_ICONS);
