export type ReplyLanguage='th'|'en';
const key='c-companion-reply-language';
export function preferredReplyLanguage():ReplyLanguage{try{return localStorage.getItem(key)==='en'?'en':'th'}catch{return 'th'}}
export function rememberReplyLanguage(language:ReplyLanguage){try{localStorage.setItem(key,language)}catch{}}
