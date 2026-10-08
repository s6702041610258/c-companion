/** Original C Companion portrait, drawn as SVG to remain crisp at chat size. */
export function BotAvatar(){
 return <svg className="bot-portrait" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
  <rect width="80" height="80" rx="25" fill="#DBEEE4"/>
  <path d="M13 80v-8c0-12 12-19 27-19s27 7 27 19v8" fill="#34765B"/>
  <path d="M40 15v-5" stroke="#285642" strokeWidth="3" strokeLinecap="round"/>
  <circle cx="40" cy="9" r="4" fill="#E7AD53"/>
  <rect x="10" y="30" width="9" height="17" rx="4" fill="#6F9F85"/>
  <rect x="61" y="30" width="9" height="17" rx="4" fill="#6F9F85"/>
  <rect x="16" y="18" width="48" height="40" rx="16" fill="#FCFFF9" stroke="#285642" strokeWidth="2.5"/>
  <rect x="22" y="27" width="36" height="21" rx="9" fill="#224C3D"/>
  <path d="M29 36v4m22-4v4" stroke="#C7F1DA" strokeWidth="4" strokeLinecap="round"/>
  <path d="M36 41q4 4 8 0" stroke="#C7F1DA" strokeWidth="2" strokeLinecap="round"/>
  <path d="M28 61q6-2 12 2q6-4 12-2v14q-6-2-12 2q-6-4-12-2V61Z" fill="#FAE3AA"/>
  <path d="M40 64v12" stroke="#B99250" strokeWidth="1.5"/>
  <path d="m34 65-3 3 3 3m12-6 3 3-3 3" stroke="#795E2D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}
