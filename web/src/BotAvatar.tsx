import avatar from './assets/mongkoi-avatar.webp';
import portrait from './assets/mongkoi-portrait.webp';

/** Raster portrait keeps Mongkoi recognizable without loading the landing's 3D scene. */
export function BotAvatar({large=false}:{large?:boolean}){
 return <img className="bot-portrait" src={large?portrait:avatar} alt="" aria-hidden="true" width={large?384:128} height={large?384:128} decoding="async"/>;
}
