export type ReplyLanguage='th'|'en';
const key='c-companion-reply-language';
export function preferredReplyLanguage():ReplyLanguage{try{return localStorage.getItem(key)==='en'?'en':'th'}catch{return 'th'}}
export function rememberReplyLanguage(language:ReplyLanguage){try{localStorage.setItem(key,language)}catch{}}
export function ReplyLanguagePicker({value,disabled,onChange}:{value:ReplyLanguage;disabled:boolean;onChange:(language:ReplyLanguage)=>void}){
 return <div className="reply-language"><span id="reply-language-label">ภาษาคำตอบ / Reply language</span><div role="group" aria-labelledby="reply-language-label">{(['th','en'] as const).map(language=><button key={language} type="button" aria-pressed={value===language} disabled={disabled} onClick={()=>onChange(language)} lang={language}>{language==='th'?'ไทย':'English'}</button>)}</div></div>;
}
